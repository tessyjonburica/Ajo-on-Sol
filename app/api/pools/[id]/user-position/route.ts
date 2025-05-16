import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get wallet_address from query params or headers
    const walletAddress = request.headers.get("wallet-address") || request.nextUrl.searchParams.get("wallet_address")
    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Checking position for wallet: ${walletAddress} in pool: ${params.id}`)

    // Get the Supabase client
    const supabase = createServerSupabaseClient()

    // Get the user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single()

    if (userError || !user) {
      console.log(`User not found for wallet: ${walletAddress}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`Found user: ${user.id} for wallet: ${walletAddress}`)

    // Get the pool details
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select(`
        id,
        creator_id,
        total_members,
        current_members
      `)
      .eq("id", params.id)
      .single()

    if (poolError || !pool) {
      console.log(`Pool not found: ${params.id}`)
      return NextResponse.json({ error: "Pool not found" }, { status: 404 })
    }

    console.log(`Found pool: ${pool.id}, creator_id: ${pool.creator_id}, user.id: ${user.id}`)
    console.log(`Pool members: ${pool.current_members}/${pool.total_members}`)

    // Check if the user is the creator
    const isCreator = pool.creator_id === user.id
    console.log(`Is creator: ${isCreator}`)

    // Get the user's membership details
    const { data: membership, error: membershipError } = await supabase
      .from("pool_members")
      .select("position, status")
      .eq("pool_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (membershipError) {
      console.log(`Error fetching membership: ${membershipError.message}`)
      return NextResponse.json({ error: "Error fetching membership" }, { status: 500 })
    }

    if (!membership) {
      console.log(`User is not a member of this pool`)
      return NextResponse.json({ 
        position: null,
        isCreator,
        isMember: false
      })
    }

    console.log(`User position: ${membership.position}, status: ${membership.status}`)

    return NextResponse.json({
      position: membership.position,
      isCreator,
      isMember: true,
      status: membership.status
    })
  } catch (error) {
    console.error("Error in GET /api/pools/[id]/user-position:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 