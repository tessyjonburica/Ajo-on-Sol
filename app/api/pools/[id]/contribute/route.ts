// Add the Solana contract integration
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { Transaction, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { getConnection } from "@/lib/solana/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const poolId = params.id
    const body = await request.json()
    const { amount, tokenSymbol, walletAddress } = body
    
    // Add debug logging
    console.log("Received contribution request:", {
      poolId,
      amount,
      tokenSymbol,
      walletAddress,
      headers: Object.fromEntries(request.headers.entries())
    })

    // Check for wallet address in both body and Authorization header
    const authHeader = request.headers.get('Authorization')
    const headerWalletAddress = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const effectiveWalletAddress = walletAddress || headerWalletAddress

    if (!effectiveWalletAddress) {
      console.error("No wallet address found in request")
      return NextResponse.json({ error: "Unauthorized - No wallet address provided" }, { status: 401 })
    }

    // Validate wallet address format
    try {
      new PublicKey(effectiveWalletAddress)
    } catch (err) {
      console.error("Invalid wallet address format:", effectiveWalletAddress)
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 })
    }
    
    if (!amount) {
      return NextResponse.json({ error: "Missing amount" }, { status: 400 })
    }
    
    if (!tokenSymbol) {
      return NextResponse.json({ error: "Missing token symbol" }, { status: 400 })
    }
    
    // Get the pool from the database
    const supabase = createServerSupabaseClient()
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("*, pool_members(*)")
      .eq("id", poolId)
      .single()
    
    if (poolError || !pool) {
      console.error("Error fetching pool:", poolError)
      return NextResponse.json({ error: "Pool not found" }, { status: 404 })
    }

    // Debug log the pool data
    console.log("Pool data:", {
      id: pool.id,
      pool_address: pool.pool_address,
      creator: pool.creator,
      members: pool.pool_members?.length
    })

    // Validate pool address or creator exists
    const recipientAddress = pool.pool_address || pool.creator
    if (!recipientAddress) {
      console.error("No valid recipient address found for pool")
      return NextResponse.json({ 
        error: "Invalid pool configuration", 
        details: "No valid recipient address found" 
      }, { status: 400 })
    }

    // Validate the recipient address format
    try {
      new PublicKey(recipientAddress)
    } catch (err) {
      console.error("Invalid recipient address format:", recipientAddress)
      return NextResponse.json({ 
        error: "Invalid pool configuration", 
        details: "Invalid recipient address format" 
      }, { status: 400 })
    }
    
    // For SOL contributions, create a transaction to transfer SOL to the pool
    if (tokenSymbol.toUpperCase() === "SOL") {
      const connection = getConnection()
      
      // Create a transaction
      const transaction = new Transaction()
      
      // Add a transfer instruction
      const amountInLamports = amount * LAMPORTS_PER_SOL
      
      // Create the transfer instruction with validated addresses
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: new PublicKey(effectiveWalletAddress),
        toPubkey: new PublicKey(recipientAddress),
        lamports: amountInLamports
      })
      
      transaction.add(transferInstruction)
      
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.lastValidBlockHeight = lastValidBlockHeight
      transaction.feePayer = new PublicKey(effectiveWalletAddress)
      
      // Serialize the transaction to send to the frontend
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      }).toString('base64')
      
      // Return the transaction for signing on the frontend
      return NextResponse.json({
        transaction: serializedTransaction,
        amount: amount,
        recipient: pool.pool_address || pool.creator
      })
    }
    
    // For other tokens, we'd need to implement token transfer logic
    // This is a placeholder for now
    return NextResponse.json({ 
      error: "Token type not supported yet",
      details: `Contributions with ${tokenSymbol} are not yet implemented`
    }, { status: 400 })
    
  } catch (error: any) {
    console.error("Error processing contribution:", error)
    return NextResponse.json({ 
      error: "Failed to process contribution", 
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
