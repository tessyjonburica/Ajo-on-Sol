import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { getPrivyUser } from "@/lib/privy/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get the pool
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select("*, pool_members(*)")
      .eq("id", params.id)
      .single()

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 })
    }

    // Check if the pool is full
    if (pool.current_members >= pool.total_members) {
      return NextResponse.json({ error: "Pool is already full" }, { status: 400 })
    }

    // Check if the user is already a member
    const isAlreadyMember = pool.pool_members.some((member: any) => member.user_id === user.id)
    if (isAlreadyMember) {
      return NextResponse.json({ error: "You are already a member of this pool" }, { status: 400 })
    }

    // Start a transaction
    const { error: transactionError } = await supabase.rpc("join_pool_transaction", {
      p_pool_id: params.id,
      p_user_id: user.id,
      p_position: pool.current_members + 1,
    })

    if (transactionError) {
      return NextResponse.json({ error: "Failed to join pool" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/pools/[id]/join:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
