import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get wallet_address from query params or headers
    const walletAddress = request.headers.get("wallet-address") || request.nextUrl.searchParams.get("wallet_address")
    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Get the pool details
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select(`
        *,
        creator:creator_id(id, wallet_address, display_name, wallet_address, avatar_url),
        next_payout_member:next_payout_member_id(id, wallet_address, display_name, wallet_address, avatar_url),
        pool_members(
          *,
          user:user_id(id, wallet_address, display_name, wallet_address, avatar_url)
        )
      `)
      .eq("id", params.id)
      .single()

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 })
    }

    // Check if the user is a member of the pool
    const { data: membership, error: membershipError } = await supabase
      .from("pool_members")
      .select("*")
      .eq("pool_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle()

    // Get the user's contributions to this pool
    const { data: contributions, error: contributionsError } = await supabase
      .from("contributions")
      .select("*")
      .eq("pool_id", params.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Get the user's penalties in this pool
    const { data: penalties, error: penaltiesError } = await supabase
      .from("penalties")
      .select("*")
      .eq("pool_id", params.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      pool,
      isMember: !!membership,
      isCreator: pool.creator_id === user.id,
      userContributions: contributions || [],
      userPenalties: penalties || [],
      userMembership: membership || null,
    })
  } catch (error) {
    console.error("Error in GET /api/pools/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the request body
    const body = await request.json()
    const walletAddress = body.wallet_address
    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Get the pool
    const { data: pool, error: poolError } = await supabase.from("pools").select("*").eq("id", params.id).single()

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 })
    }

    // Check if the user is the creator of the pool
    if (pool.creator_id !== user.id) {
      return NextResponse.json({ error: "Only the pool creator can update the pool" }, { status: 403 })
    }

    // Update the pool
    const { data: updatedPool, error: updateError } = await supabase
      .from("pools")
      .update({
        name: body.name || pool.name,
        description: body.description || pool.description,
        contribution_amount: body.contributionAmount || pool.contribution_amount,
        frequency: body.frequency || pool.frequency,
        total_members: body.totalMembers || pool.total_members,
        start_date: body.startDate || pool.start_date,
        end_date: body.endDate || pool.end_date,
        yield_enabled: body.yieldEnabled !== undefined ? body.yieldEnabled : pool.yield_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Failed to update pool" }, { status: 500 })
    }

    return NextResponse.json({ pool: updatedPool })
  } catch (error) {
    console.error("Error in PUT /api/pools/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
