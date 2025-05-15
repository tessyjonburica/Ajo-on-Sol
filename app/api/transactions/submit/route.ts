import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { submitSignedTransaction } from "@/lib/solana/server"
import { Connection } from "@solana/web3.js"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    
    // Validate the request
    if (!body.signedTransaction) {
      return NextResponse.json({ error: "Missing signed transaction" }, { status: 400 })
    }
    
    if (!body.poolId) {
      return NextResponse.json({ error: "Missing pool ID" }, { status: 400 })
    }
    
    console.log("Received signed transaction for submission")
    
    try {
      // First check if we already have a signature for this pool
      const supabase = createServerSupabaseClient()
      const { data: pool } = await supabase
        .from("pools")
        .select("solana_tx_signature, status")
        .eq("id", body.poolId)
        .single()
      
      if (pool?.solana_tx_signature) {
        // We already have a signature, verify if it's valid
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
        )
        
        try {
          const status = await connection.getSignatureStatus(pool.solana_tx_signature)
          if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
            return NextResponse.json({
              success: true,
              txSignature: pool.solana_tx_signature,
              warning: "Transaction was already processed"
            })
          }
        } catch (error) {
          console.log("Error checking existing signature:", error)
          // Continue with new submission if signature check fails
        }
      }
      
      // Submit the signed transaction
      const txSignature = await submitSignedTransaction(body.signedTransaction)
      console.log("Transaction submitted and confirmed successfully:", txSignature)
      
      // Update the pool record with the transaction signature
      const { error: updateError } = await supabase
        .from("pools")
        .update({
          solana_tx_signature: txSignature,
          status: "active"
        })
        .eq("id", body.poolId)
      
      if (updateError) {
        console.error("Failed to update pool with transaction signature:", updateError)
        // Return success anyway since the blockchain transaction succeeded
      }
      
      return NextResponse.json({
        success: true,
        txSignature
      })
    } catch (txError: any) {
      console.error("Error submitting transaction:", txError)
      
      // Special handling for "already processed" errors
      if (txError.message?.includes("already been processed")) {
        // Set the pool to active since the transaction was likely processed
        const supabase = createServerSupabaseClient()
        await supabase
          .from("pools")
          .update({ status: "active" })
          .eq("id", body.poolId)
        
        return NextResponse.json({
          success: true,
          warning: "Transaction was already processed, but signature is unknown"
        }, { status: 200 })
      }
      
      return NextResponse.json({ 
        error: "Failed to submit transaction", 
        details: txError?.message || String(txError)
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error processing transaction submission request:", error)
    return NextResponse.json({ 
      error: "Failed to process request", 
      details: error?.message || String(error)
    }, { status: 500 })
  }
} 