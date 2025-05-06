import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { getPrivyUser } from "@/lib/privy/server"

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
    if (!body.poolId || !body.title || !body.description || !body.type || !body.durationDays) {
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

    // Check if the user is a member of the pool
    const { data: membership, error: membershipError } = await supabase
      .from("pool_members")
      .select("*")
      .eq("pool_id", body.poolId)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "You are not a member of this pool" }, { status: 403 })
    }

    // Calculate the end date for the proposal
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + body.durationDays)

    // Create the proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .insert({
        pool_id: body.poolId,
        proposer_id: user.id,
        title: body.title,
        description: body.description,
        type: body.type,
        status: "active",
        ends_at: endsAt.toISOString(),
        execution_data: body.executionData || null,
        target_user_id: body.targetUserId || null,
      })
      .select()
      .single()

    if (proposalError) {
      return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 })
    }

    return NextResponse.json({ proposal })
  } catch (error) {
    console.error("Error in POST /api/proposals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
