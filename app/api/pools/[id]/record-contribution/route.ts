import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { verifyTransaction } from "@/lib/solana/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const poolId = params.id
    const body = await request.json()
    const { amount, transactionSignature, walletAddress, tokenSymbol } = body

    console.log("Recording contribution:", {
      poolId,
      amount,
      transactionSignature,
      walletAddress,
      tokenSymbol
    })

    if (!transactionSignature) {
      return NextResponse.json({ error: "Missing transaction signature" }, { status: 400 })
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 })
    }

    // Verify the transaction on Solana
    const isVerified = await verifyTransaction(transactionSignature)
    if (!isVerified) {
      return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Get the user by wallet address
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the pool
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("*")
      .eq("id", poolId)
      .single()

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 })
    }

    // Start a transaction to update both pool and member records
    const { data: contribution, error: contributionError } = await supabase
      .from("contributions")
      .insert({
        pool_id: poolId,
        user_id: user.id,
        amount: amount,
        token: pool.contribution_token || 'SOL', // Use pool's token or default to SOL
        token_symbol: pool.contribution_token_symbol || 'SOL',
        transaction_signature: transactionSignature,
        status: "confirmed"
      })
      .select()
      .single()

    if (contributionError) {
      console.error("Failed to record contribution:", contributionError)
      return NextResponse.json({ 
        error: "Failed to record contribution",
        details: contributionError.message
      }, { status: 500 })
    }

    // Update pool's total contributed amount
    const { error: poolUpdateError } = await supabase
      .from("pools")
      .update({
        total_contributed: pool.total_contributed + Number(amount)
      })
      .eq("id", poolId)

    if (poolUpdateError) {
      console.error("Failed to update pool total:", poolUpdateError)
      return NextResponse.json({ 
        error: "Failed to update pool total",
        details: poolUpdateError.message
      }, { status: 500 })
    }

    // Update member's contribution total
    // First get the current contribution total
    const { data: memberData, error: memberFetchError } = await supabase
      .from("pool_members")
      .select("total_contributed")
      .eq("pool_id", poolId)
      .eq("user_id", user.id)
      .single()

    if (memberFetchError) {
      console.error("Failed to fetch member data:", memberFetchError)
      return NextResponse.json({ 
        error: "Failed to update member contribution",
        details: memberFetchError.message
      }, { status: 500 })
    }

    // Then update with the new total
    const currentTotal = memberData?.total_contributed || 0
    const newTotal = currentTotal + Number(amount)

    const { error: memberUpdateError } = await supabase
      .from("pool_members")
      .update({
        total_contributed: newTotal
      })
      .eq("pool_id", poolId)
      .eq("user_id", user.id)

    if (memberUpdateError) {
      console.error("Failed to update member contribution:", memberUpdateError)
      return NextResponse.json({ 
        error: "Failed to update member contribution",
        details: memberUpdateError.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, contribution })
  } catch (error: any) {
    console.error("Error recording contribution:", error)
    return NextResponse.json({ 
      error: "Failed to record contribution", 
      details: error?.message || String(error) 
    }, { status: 500 })
  }
} 