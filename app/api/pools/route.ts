import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"

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
      // const dummyPrivyId = `wallet:${walletAddress}`
      const { data: newUser, error: newUserError } = await supabase
        .from("users")
        .insert({ wallet_address: walletAddress })
        .select("id")
        .single()
      if (newUserError || !newUser) {
        console.error("Failed to create user:", newUserError)
        return NextResponse.json({ error: "Failed to create user", details: newUserError?.message }, { status: 500 })
      }
      user = newUser
    }

    // Create the pool
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
      return NextResponse.json({ error: "Failed to create pool" }, { status: 500 })
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
      return NextResponse.json({ error: "Failed to add creator as member" }, { status: 500 })
    }

    return NextResponse.json({ pool })
  } catch (error) {
    console.error("Error in POST /api/pools:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

