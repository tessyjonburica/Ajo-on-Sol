import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { getPrivyUser } from "@/lib/privy/server"
import { verifyTransaction } from "@/lib/solana/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the Privy user from the request
    const privyUser = await getPrivyUser(request)
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the request body
    const body = await request.json()

    // Validate the request body
    if (!body.amount || !body.transactionSignature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the Supabase client
    const supabase = createServerSupabaseClient()

    // Get the user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", privyUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the pool
    const { data: pool, error: poolError } = await supabase.from("pools").select("*").eq("id", params.id).single()

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 })
    }

    // Check if the user is a member of the pool
    const { data: membership, error: membershipError } = await supabase
      .from("pool_members")
      .select("*")
      .eq("pool_id", params.id)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "You are not a member of this pool" }, { status: 403 })
    }

    // Verify the transaction
    const isVerified = await verifyTransaction(body.transactionSignature)
    if (!isVerified) {
      return NextResponse.json({ error: "Invalid transaction signature" }, { status: 400 })
    }

    // Check if the contribution is late
    const now = new Date()
    const nextPayoutDate = new Date(pool.next_payout_date)
    const contributionDeadline = new Date(nextPayoutDate)
    contributionDeadline.setDate(contributionDeadline.getDate() - 3) // 3 days before payout

    const isLate = now > contributionDeadline

    // Calculate penalty if late
    let penaltyAmount = 0
    if (isLate) {
      penaltyAmount = body.amount * 0.02 // 2% penalty for late contributions
    }

    // Record the contribution
    const { data: contribution, error: contributionError } = await supabase
      .from("contributions")
      .insert({
        pool_id: params.id,
        user_id: user.id,
        amount: body.amount,
        token: pool.contribution_token,
        token_symbol: pool.contribution_token_symbol,
        transaction_signature: body.transactionSignature,
        status: "confirmed", // Assuming the transaction is already confirmed
        is_late: isLate,
        penalty_amount: isLate ? penaltyAmount : null,
      })
      .select()
      .single()

    if (contributionError) {
      return NextResponse.json({ error: "Failed to record contribution" }, { status: 500 })
    }

    // Update the pool's total contributed amount
    const { error: updatePoolError } = await supabase
      .from("pools")
      .update({
        total_contributed: pool.total_contributed + body.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updatePoolError) {
      return NextResponse.json({ error: "Failed to update pool total" }, { status: 500 })
    }

    // Update the member's contribution record
    const { error: updateMemberError } = await supabase
      .from("pool_members")
      .update({
        total_contributed: membership.total_contributed + body.amount,
        last_contribution_date: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", membership.id)

    if (updateMemberError) {
      return NextResponse.json({ error: "Failed to update member contribution" }, { status: 500 })
    }

    // If there's a penalty, record it
    if (isLate && penaltyAmount > 0) {
      const { error: penaltyError } = await supabase.from("penalties").insert({
        pool_id: params.id,
        user_id: user.id,
        amount: penaltyAmount,
        token: pool.contribution_token,
        token_symbol: pool.contribution_token_symbol,
        reason: "late_contribution",
        status: "pending",
      })

      if (penaltyError) {
        console.error("Error recording penalty:", penaltyError)
        // Don't throw here, as the contribution was successful
      }
    }

    return NextResponse.json({
      contribution,
      isLate,
      penaltyAmount,
    })
  } catch (error) {
    console.error("Error in POST /api/pools/[id]/contribute:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
