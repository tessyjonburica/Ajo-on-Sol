import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the request body
    const body = await request.json()

    // Validate the request body
    if (!body.vote || !["yes", "no", "abstain"].includes(body.vote)) {
      return NextResponse.json({ error: "Invalid vote" }, { status: 400 })
    }

    // Get the Supabase client
    const supabase = createServerSupabaseClient()

    // Get the user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", request.headers.get("wallet-address"))
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("*, pools(*)")
      .eq("id", params.id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    // Check if the proposal is still active
    if (proposal.status !== "active") {
      return NextResponse.json({ error: "This proposal is no longer active" }, { status: 400 })
    }

    // Check if the proposal has ended
    if (new Date(proposal.ends_at) < new Date()) {
      return NextResponse.json({ error: "This proposal has ended" }, { status: 400 })
    }

    // Check if the user is a member of the pool
    const { data: membership, error: membershipError } = await supabase
      .from("pool_members")
      .select("*")
      .eq("pool_id", proposal.pool_id)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "You are not a member of this pool" }, { status: 403 })
    }

    // Check if the user has already voted
    const { data: existingVote, error: existingVoteError } = await supabase
      .from("votes")
      .select("*")
      .eq("proposal_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle()

    // If the user has already voted, update their vote
    if (existingVote) {
      const { error: updateVoteError } = await supabase
        .from("votes")
        .update({
          vote: body.vote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingVote.id)

      if (updateVoteError) {
        return NextResponse.json({ error: "Failed to update vote" }, { status: 500 })
      }
    } else {
      // Otherwise, create a new vote
      const { error: createVoteError } = await supabase.from("votes").insert({
        proposal_id: params.id,
        user_id: user.id,
        vote: body.vote,
      })

      if (createVoteError) {
        return NextResponse.json({ error: "Failed to create vote" }, { status: 500 })
      }
    }

    // Get the updated vote counts
    const { data: votes, error: votesError } = await supabase.from("votes").select("vote").eq("proposal_id", params.id)

    if (votesError) {
      return NextResponse.json({ error: "Failed to get vote counts" }, { status: 500 })
    }

    // Count the votes
    const voteCounts = {
      yes: votes.filter((v) => v.vote === "yes").length,
      no: votes.filter((v) => v.vote === "no").length,
      abstain: votes.filter((v) => v.vote === "abstain").length,
      total: votes.length,
    }

    return NextResponse.json({
      success: true,
      voteCounts,
    })
  } catch (error) {
    console.error("Error in POST /api/proposals/[id]/vote:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
