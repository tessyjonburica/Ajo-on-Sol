import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { getPrivyUser } from "@/lib/privy/server"

export async function GET(request: NextRequest) {
  try {
    // Get the Privy user from the request
    const privyUser = await getPrivyUser(request)
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Get all pools where the user is a member
    const { data: memberships, error: membershipsError } = await supabase
      .from("pool_members")
      .select("pool_id")
      .eq("user_id", user.id)
      .eq("status", "active")

    if (membershipsError) {
      return NextResponse.json({ error: "Failed to fetch memberships" }, { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ pools: [] })
    }

    // Get the pool details
    const poolIds = memberships.map((m) => m.pool_id)
    const { data: pools, error: poolsError } = await supabase
      .from("pools")
      .select(`
        *,
        creator:creator_id(id, privy_id, display_name, wallet_address, avatar_url),
        next_payout_member:next_payout_member_id(id, privy_id, display_name, wallet_address, avatar_url),
        pool_members(
          *,
          user:user_id(id, privy_id, display_name, wallet_address, avatar_url)
        )
      `)
      .in("id", poolIds)

    if (poolsError) {
      return NextResponse.json({ error: "Failed to fetch pools" }, { status: 500 })
    }

    return NextResponse.json({ pools: pools || [] })
  } catch (error) {
    console.error("Error in GET /api/pools:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the Privy user from the request
    const privyUser = await getPrivyUser(request)
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the request body
    const body = await request.json()

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

    // Get the user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("privy_id", privyUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
