import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { createPoolOnChain, preparePoolCreationTransaction } from "@/lib/solana/server"
import { calculateCyclesFromDates } from "@/lib/utils/dates"

export async function GET(request: NextRequest) {
  // Get wallet address from query param or header
  const url = new URL(request.url)
  const walletAddress = url.searchParams.get("wallet_address") || request.headers.get("wallet-address")
  if (!walletAddress) {
    return NextResponse.json({ error: "Missing wallet address" }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Get the user by wallet address
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", walletAddress)
    .maybeSingle()

  if (userError || !user) {
    return NextResponse.json({ pools: [] })
  }

  // Get all pool memberships for the user
  const { data: memberships, error: membershipsError } = await supabase
    .from("pool_members")
    .select("pool_id")
    .eq("user_id", user.id)
    .eq("status", "active")

  if (membershipsError || !memberships || memberships.length === 0) {
    return NextResponse.json({ pools: [] })
  }

  // Get the pool details
  const poolIds = memberships.map((m) => m.pool_id)
  const { data: pools, error: poolsError } = await supabase
    .from("pools")
    .select("*")
    .in("id", poolIds)
    .order("created_at", { ascending: false })

  if (poolsError) {
    return NextResponse.json({ error: poolsError.message }, { status: 500 })
  }

  return NextResponse.json({ pools: pools || [] })
}

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const walletAddress = body.wallet_address
    if (!walletAddress) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 })
    }

    // Validate the request body
    if (
      !body.name ||
      !body.description ||
      !body.contributionAmount ||
      !body.contributionToken ||
      !body.contributionTokenSymbol ||
      !body.frequency ||
      !body.totalMembers ||
      !body.startDate ||
      !body.endDate
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the Supabase client
    const supabase = createServerSupabaseClient()

    // Get the user from Supabase by wallet_address
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .maybeSingle()

    // If user does not exist, create one
    if (!user) {
      // Add a dummy privy_id for now to satisfy NOT NULL constraint
      const dummyPrivyId = `wallet:${walletAddress}`
      const { data: newUser, error: newUserError } = await supabase
        .from("users")
        .insert({ wallet_address: walletAddress, privy_id: dummyPrivyId })
        .select("id")
        .single()
      if (newUserError || !newUser) {
        console.error("Failed to create user:", newUserError)
        return NextResponse.json({ error: "Failed to create user", details: newUserError?.message }, { status: 500 })
      }
      user = newUser
    }

    // Create the pool in Supabase
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .insert({
        name: body.name,
        description: body.description,
        creator_id: user.id,
        contribution_amount: body.contributionAmount,
        contribution_token: body.contributionToken,
        contribution_token_symbol: body.contributionTokenSymbol,
        frequency: body.frequency,
        total_members: body.totalMembers,
        current_members: 1, // Creator is the first member
        start_date: body.startDate,
        end_date: body.endDate,
        next_payout_date: body.startDate, // Initially set to start date
        next_payout_member_id: user.id, // Creator is the first to receive payout
        total_contributed: 0,
        yield_enabled: body.yieldEnabled || false,
        status: "pending",
        slug: body.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim(),
      })
      .select()
      .single()

    if (poolError) {
      console.error("Failed to create pool in Supabase:", poolError)
      return NextResponse.json({ error: "Failed to create pool", details: poolError.message }, { status: 500 })
    }

    // Add the creator as the first member
    const { error: memberError } = await supabase.from("pool_members").insert({
      pool_id: pool.id,
      user_id: user.id,
      position: 1, // First position in the rotation
      has_received_payout: false,
      total_contributed: 0,
      status: "active",
    })

    if (memberError) {
      console.error("Failed to add creator as member:", memberError)
      return NextResponse.json({ error: "Failed to add creator as member", details: memberError.message }, { status: 500 })
    }

    // Now prepare a transaction for the frontend to sign
    try {
      // Calculate number of cycles based on start and end dates
      const startDate = new Date(body.startDate)
      const endDate = new Date(body.endDate)
      const totalCycles = calculateCyclesFromDates(startDate, endDate, body.frequency)

      // Prepare the transaction for frontend signing
      const { transaction, poolAddress } = await preparePoolCreationTransaction(
        body.name,
        body.contributionAmount,
        body.totalMembers,
        totalCycles,
        body.frequency === "weekly" ? "weekly" : "monthly", // Convert frequency to the format expected by the contract
        1, // Creator position is 1 (first)
        walletAddress
      )

      // Update the pool with the Solana address
      const { error: updateError } = await supabase
        .from("pools")
        .update({
          solana_address: poolAddress,
          // We don't have a txSignature yet - that will come after the user signs
        })
        .eq("id", pool.id)

      if (updateError) {
        console.error("Failed to update pool with blockchain info:", updateError)
      }

      // Return the transaction for frontend signing
      return NextResponse.json({ 
        pool, 
        transaction,
        poolAddress
      })
      
    } catch (chainError) {
      console.error("Failed to prepare pool creation transaction:", chainError)
      // Still return the pool data, but with an error message
      return NextResponse.json({ 
        pool,
        error: "Failed to prepare blockchain transaction",
        details: chainError instanceof Error ? chainError.message : String(chainError)
      })
    }
  } catch (error) {
    console.error("Error in POST /api/pools:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

