import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  try {
    const walletAddress = "G7urqd6itSc13jqrygvUWCd8cj8SUm5tvSdef3FyydFT"
    
    // Get the Supabase client
    const supabase = createServerSupabaseClient()

    // Get the user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found", details: userError?.message }, { status: 404 })
    }

    // Get all pools where the user is a member
    const { data: memberships, error: membershipError } = await supabase
      .from("pool_members")
      .select("pool_id, position, status")
      .eq("user_id", user.id)

    if (membershipError) {
      return NextResponse.json({ error: "Error fetching memberships", details: membershipError.message }, { status: 500 })
    }

    // Get the pools where the user is a creator
    const { data: createdPools, error: createdPoolsError } = await supabase
      .from("pools")
      .select("id, name, creator_id")
      .eq("creator_id", user.id)

    if (createdPoolsError) {
      return NextResponse.json({ error: "Error fetching created pools", details: createdPoolsError.message }, { status: 500 })
    }

    // For each membership, get the pool details
    const poolDetails = []
    for (const membership of memberships || []) {
      const { data: pool, error: poolError } = await supabase
        .from("pools")
        .select("id, name, creator_id, current_members, total_members")
        .eq("id", membership.pool_id)
        .single()

      if (!poolError && pool) {
        poolDetails.push({
          ...pool,
          userPosition: membership.position,
          userStatus: membership.status,
          isCreator: pool.creator_id === user.id
        })
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress
      },
      memberships: memberships || [],
      createdPools: createdPools || [],
      poolDetails
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 