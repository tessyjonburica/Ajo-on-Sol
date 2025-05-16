import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { verifyTransaction } from "@/lib/solana/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the request body
    const body = await request.json()
    const walletAddress = body.wallet_address
    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate the transaction signature
    const transactionSignature = body.transactionSignature
    if (!transactionSignature) {
      return NextResponse.json({ error: "Transaction signature required" }, { status: 400 })
    }

    // Get the Supabase client
    const supabase = createServerSupabaseClient()

    // Get the user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the pool with the next payout member
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select(`
        *,
        next_payout_member:next_payout_member_id(id, wallet_address, display_name)
      `)
      .eq("id", params.id)
      .single()

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 })
    }

    // Check if the user is the creator of the pool
    if (pool.creator_id !== user.id) {
      return NextResponse.json({ error: "Only the pool creator can process payouts" }, { status: 403 })
    }

    // Check if there's a next payout member
    if (!pool.next_payout_member_id || !pool.next_payout_member) {
      return NextResponse.json({ error: "No next payout member set for this pool" }, { status: 400 })
    }

    // Verify the transaction signature
    const isVerified = await verifyTransaction(transactionSignature)
    if (!isVerified) {
      return NextResponse.json({ error: "Invalid transaction signature" }, { status: 400 })
    }

    console.log(`Verified transaction ${transactionSignature} for pool ${params.id}, proceeding with database update`)

    // Calculate the payout amount
    const payoutAmount = pool.contribution_amount * pool.current_members

    // Use the stored procedure to process the payout in the database
    const { error: payoutError } = await supabase.rpc("process_payout_transaction", {
      p_pool_id: params.id,
      p_recipient_id: pool.next_payout_member_id,
      p_amount: payoutAmount,
      p_transaction_signature: transactionSignature,
    })

    if (payoutError) {
      console.error("Error processing payout in database:", payoutError)
      return NextResponse.json({ error: "Failed to process payout", details: payoutError.message }, { status: 500 })
    }

    // Get the updated pool to return
    const { data: updatedPool, error: updatedPoolError } = await supabase
      .from("pools")
      .select(`
        *,
        next_payout_member:next_payout_member_id(id, wallet_address, display_name, avatar_url)
      `)
      .eq("id", params.id)
      .single()

    if (updatedPoolError) {
      return NextResponse.json({ error: "Failed to get updated pool", details: updatedPoolError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      pool: updatedPool,
      payoutAmount: payoutAmount,
      transactionSignature: transactionSignature
    })
  } catch (error) {
    console.error("Error in POST /api/pools/[id]/payout/confirm:", error)
    return NextResponse.json({ error: "Internal server error", details: error?.message || String(error) }, { status: 500 })
  }
} 