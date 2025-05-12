"use server"

import { createServerSupabaseClient } from "../supabase/client"
import { revalidatePath } from "next/cache"
import { generateSlug } from "../utils/slug"
import { calculateNextPayoutDate } from "../utils/dates"
import type { InsertTables } from "../supabase/schema"

// Create a new pool
export async function createPool(
  poolData: Omit<
    InsertTables<"pools">,
    "id" | "created_at" | "updated_at" | "slug" | "current_members" | "total_contributed" | "next_payout_date"
  >,
  wallet_address: string,
) {
  const supabase = createServerSupabaseClient()

  // Get the user from Supabase
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("wallet_address", wallet_address).single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  // Generate a slug from the pool name
  const slug = generateSlug(poolData.name)

  // Calculate the next payout date based on the start date and frequency
  const nextPayoutDate = calculateNextPayoutDate(new Date(poolData.start_date), poolData.frequency)

  // Create the pool
  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .insert({
      ...poolData,
      creator_id: user.id,
      slug,
      current_members: 1, // Creator is the first member
      total_contributed: 0,
      next_payout_date: nextPayoutDate.toISOString(),
      next_payout_member_id: user.id, // Creator is the first to receive payout
      status: "pending",
    })
    .select()
    .single()

  if (poolError) {
    console.error("Error creating pool:", poolError)
    throw poolError
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
    console.error("Error adding creator as member:", memberError)
    throw memberError
  }

  revalidatePath("/dashboard")
  revalidatePath(`/pool/${pool.id}`)

  return pool
}

// Join an existing pool
export async function joinPool(poolId: string, wallet_address: string) {
  const supabase = createServerSupabaseClient()

  // Get the user from Supabase
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("wallet_address", wallet_address).single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  // Get the pool
  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("*, pool_members(*)")
    .eq("id", poolId)
    .single()

  if (poolError || !pool) {
    throw new Error("Pool not found")
  }

  // Check if the pool is full
  if (pool.current_members >= pool.total_members) {
    throw new Error("Pool is already full")
  }

  // Check if the user is already a member
  const isAlreadyMember = pool.pool_members.some((member: any) => member.user_id === user.id)
  if (isAlreadyMember) {
    throw new Error("You are already a member of this pool")
  }

  // Start a transaction
  const { error: transactionError } = await supabase.rpc("join_pool_transaction", {
    p_pool_id: poolId,
    p_user_id: user.id,
    p_position: pool.current_members + 1,
  })

  if (transactionError) {
    console.error("Error joining pool:", transactionError)
    throw transactionError
  }

  revalidatePath("/dashboard")
  revalidatePath(`/pool/${poolId}`)

  return { success: true }
}

// Make a contribution to a pool
export async function contributeToPool(poolId: string, amount: number, transactionSignature: string, wallet_address: string) {
  const supabase = createServerSupabaseClient()

  // Get the user from Supabase
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("wallet_address", wallet_address).single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  // Get the pool
  const { data: pool, error: poolError } = await supabase.from("pools").select("*").eq("id", poolId).single()

  if (poolError || !pool) {
    throw new Error("Pool not found")
  }

  // Check if the user is a member of the pool
  const { data: membership, error: membershipError } = await supabase
    .from("pool_members")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    throw new Error("You are not a member of this pool")
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
    penaltyAmount = amount * 0.02 // 2% penalty for late contributions
  }

  // Record the contribution
  const { data: contribution, error: contributionError } = await supabase
    .from("contributions")
    .insert({
      pool_id: poolId,
      user_id: user.id,
      amount,
      token: pool.contribution_token,
      token_symbol: pool.contribution_token_symbol,
      transaction_signature: transactionSignature,
      status: "confirmed", // Assuming the transaction is already confirmed
      is_late: isLate,
      penalty_amount: isLate ? penaltyAmount : null,
    })
    .select()
    .single()

  if (contributionError) {
    console.error("Error recording contribution:", contributionError)
    throw contributionError
  }

  // Update the pool's total contributed amount
  const { error: updatePoolError } = await supabase
    .from("pools")
    .update({
      total_contributed: pool.total_contributed + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", poolId)

  if (updatePoolError) {
    console.error("Error updating pool total:", updatePoolError)
    throw updatePoolError
  }

  // Update the member's contribution record
  const { error: updateMemberError } = await supabase
    .from("pool_members")
    .update({
      total_contributed: membership.total_contributed + amount,
      last_contribution_date: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", membership.id)

  if (updateMemberError) {
    console.error("Error updating member contribution:", updateMemberError)
    throw updateMemberError
  }

  // If there's a penalty, record it
  if (isLate && penaltyAmount > 0) {
    const { error: penaltyError } = await supabase.from("penalties").insert({
      pool_id: poolId,
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

  revalidatePath("/dashboard")
  revalidatePath(`/pool/${poolId}`)

  return {
    contribution,
    isLate,
    penaltyAmount,
  }
}

// Process a payout for a pool
export async function processPoolPayout(poolId: string, transactionSignature: string, wallet_address: string) {
  const supabase = createServerSupabaseClient()

  // Get the user from Supabase (must be the pool creator or admin)
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("wallet_address", wallet_address).single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  // Get the pool with the next payout member
  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("*, pool_members(*)")
    .eq("id", poolId)
    .single()

  if (poolError || !pool) {
    throw new Error("Pool not found")
  }

  // Check if the user is the creator of the pool
  if (pool.creator_id !== user.id) {
    throw new Error("Only the pool creator can process payouts")
  }

  // Check if there's a next payout member
  if (!pool.next_payout_member_id) {
    throw new Error("No next payout member set for this pool")
  }

  // Get the recipient
  const { data: recipient, error: recipientError } = await supabase
    .from("users")
    .select("id")
    .eq("id", pool.next_payout_member_id)
    .single()

  if (recipientError || !recipient) {
    throw new Error("Recipient not found")
  }

  // Calculate the payout amount (total contributions for this cycle)
  const payoutAmount = pool.contribution_amount * pool.current_members

  // Record the payout
  const { data: payout, error: payoutError } = await supabase
    .from("payouts")
    .insert({
      pool_id: poolId,
      recipient_id: recipient.id,
      amount: payoutAmount,
      token: pool.contribution_token,
      token_symbol: pool.contribution_token_symbol,
      transaction_signature: transactionSignature,
      status: "confirmed",
      payout_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (payoutError) {
    console.error("Error recording payout:", payoutError)
    throw payoutError
  }

  // Update the recipient's record to mark they've received a payout
  const { error: updateMemberError } = await supabase
    .from("pool_members")
    .update({
      has_received_payout: true,
      updated_at: new Date().toISOString(),
    })
    .eq("pool_id", poolId)
    .eq("user_id", recipient.id)

  if (updateMemberError) {
    console.error("Error updating member payout status:", updateMemberError)
    throw updateMemberError
  }

  // Determine the next recipient in the rotation
  const members = pool.pool_members.filter((m: any) => m.status === "active")
  members.sort((a: any, b: any) => a.position - b.position)

  // Find the current recipient's position
  const currentRecipientIndex = members.findIndex((m: any) => m.user_id === recipient.id)

  // Get the next recipient (wrap around if at the end)
  const nextRecipientIndex = (currentRecipientIndex + 1) % members.length
  const nextRecipient = members[nextRecipientIndex]

  // Calculate the next payout date based on the frequency
  const nextPayoutDate = calculateNextPayoutDate(new Date(), pool.frequency)

  // Update the pool with the next payout information
  const { error: updatePoolError } = await supabase
    .from("pools")
    .update({
      next_payout_member_id: nextRecipient.user_id,
      next_payout_date: nextPayoutDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", poolId)

  if (updatePoolError) {
    console.error("Error updating pool next payout:", updatePoolError)
    throw updatePoolError
  }

  revalidatePath("/dashboard")
  revalidatePath(`/pool/${poolId}`)

  return {
    payout,
    nextPayoutDate,
    nextRecipient: nextRecipient.user_id,
  }
}

// Create a proposal for a pool
export async function createProposal(
  poolId: string,
  proposalData: {
    title: string
    description: string
    type: InsertTables<"proposals">["type"]
    executionData?: any
    targetUserId?: string
    durationDays: number
  },
  wallet_address: string,
) {
  const supabase = createServerSupabaseClient()

  // Get the user from Supabase
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("wallet_address", wallet_address).single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  // Check if the user is a member of the pool
  const { data: membership, error: membershipError } = await supabase
    .from("pool_members")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    throw new Error("You are not a member of this pool")
  }

  // Calculate the end date for the proposal
  const endsAt = new Date()
  endsAt.setDate(endsAt.getDate() + proposalData.durationDays)

  // Create the proposal
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .insert({
      pool_id: poolId,
      proposer_id: user.id,
      title: proposalData.title,
      description: proposalData.description,
      type: proposalData.type,
      status: "active",
      ends_at: endsAt.toISOString(),
      execution_data: proposalData.executionData || null,
      target_user_id: proposalData.targetUserId || null,
    })
    .select()
    .single()

  if (proposalError) {
    console.error("Error creating proposal:", proposalError)
    throw proposalError
  }

  revalidatePath(`/pool/${poolId}`)
  revalidatePath(`/vote/${poolId}`)

  return proposal
}

// Vote on a proposal
export async function voteOnProposal(proposalId: string, vote: "yes" | "no" | "abstain", wallet_address: string) {
  const supabase = createServerSupabaseClient()

  // Get the user from Supabase
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("wallet_address", wallet_address).single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  // Get the proposal
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("*, pools(*)")
    .eq("id", proposalId)
    .single()

  if (proposalError || !proposal) {
    throw new Error("Proposal not found")
  }

  // Check if the proposal is still active
  if (proposal.status !== "active") {
    throw new Error("This proposal is no longer active")
  }

  // Check if the proposal has ended
  if (new Date(proposal.ends_at) < new Date()) {
    throw new Error("This proposal has ended")
  }

  // Check if the user is a member of the pool
  const { data: membership, error: membershipError } = await supabase
    .from("pool_members")
    .select("*")
    .eq("pool_id", proposal.pool_id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    throw new Error("You are not a member of this pool")
  }

  // Check if the user has already voted
  const { data: existingVote, error: existingVoteError } = await supabase
    .from("votes")
    .select("*")
    .eq("proposal_id", proposalId)
    .eq("user_id", user.id)
    .maybeSingle()

  // If the user has already voted, update their vote
  if (existingVote) {
    const { error: updateVoteError } = await supabase
      .from("votes")
      .update({
        vote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingVote.id)

    if (updateVoteError) {
      console.error("Error updating vote:", updateVoteError)
      throw updateVoteError
    }
  } else {
    // Otherwise, create a new vote
    const { error: createVoteError } = await supabase.from("votes").insert({
      proposal_id: proposalId,
      user_id: user.id,
      vote,
    })

    if (createVoteError) {
      console.error("Error creating vote:", createVoteError)
      throw createVoteError
    }
  }

  revalidatePath(`/vote/${proposal.pool_id}`)

  return { success: true }
}

// Get all pools for a user
export async function getUserPools(wallet_address: string) {
  const supabase = createServerSupabaseClient()

  // Get the user from Supabase
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("wallet_address", wallet_address).single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  // Get all pools where the user is a member
  const { data: memberships, error: membershipsError } = await supabase
    .from("pool_members")
    .select("pool_id")
    .eq("user_id", user.id)
    .eq("status", "active")

  if (membershipsError) {
    console.error("Error fetching memberships:", membershipsError)
    throw membershipsError
  }

  if (!memberships || memberships.length === 0) {
    return []
  }

  // Get the pool details
  const poolIds = memberships.map((m) => m.pool_id)
  const { data: pools, error: poolsError } = await supabase.from("pools").select("*").in("id", poolIds)

  if (poolsError) {
    console.error("Error fetching pools:", poolsError)
    throw poolsError
  }

  return pools || []
}

// Get detailed pool information
export async function getPoolDetails(poolId: string, wallet_address: string) {
  const supabase = createServerSupabaseClient()

  // Get the user from Supabase
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("wallet_address", wallet_address).single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  // Check if the user is a member of the pool
  const { data: membership, error: membershipError } = await supabase
    .from("pool_members")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .maybeSingle()

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
    .eq("id", poolId)
    .single()

  if (poolError || !pool) {
    throw new Error("Pool not found")
  }

  // Get the user's contributions to this pool
  const { data: contributions, error: contributionsError } = await supabase
    .from("contributions")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (contributionsError) {
    console.error("Error fetching contributions:", contributionsError)
    // Don't throw, as we can still return the pool details
  }

  // Get the user's penalties in this pool
  const { data: penalties, error: penaltiesError } = await supabase
    .from("penalties")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (penaltiesError) {
    console.error("Error fetching penalties:", penaltiesError)
    // Don't throw, as we can still return the pool details
  }

  return {
    pool,
    isMember: !!membership,
    isCreator: pool.creator_id === user.id,
    userContributions: contributions || [],
    userPenalties: penalties || [],
    userMembership: membership || null,
  }
}

// Execute a proposal that has passed
export async function executeProposal(proposalId: string, wallet_address: string) {
  const supabase = createServerSupabaseClient()

  // Get the user from Supabase
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("wallet_address", wallet_address).single()

  if (userError || !user) {
    throw new Error("User not found")
  }

  // Get the proposal with votes
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select(`
      *,
      pools(*),
      votes(*)
    `)
    .eq("id", proposalId)
    .single()

  if (proposalError || !proposal) {
    throw new Error("Proposal not found")
  }

  // Check if the user is the creator of the pool
  if (proposal.pools.creator_id !== user.id) {
    throw new Error("Only the pool creator can execute proposals")
  }

  // Check if the proposal has ended
  if (new Date(proposal.ends_at) > new Date()) {
    throw new Error("This proposal has not ended yet")
  }

  // Check if the proposal has already been executed
  if (proposal.status === "executed") {
    throw new Error("This proposal has already been executed")
  }

  // Count the votes
  const yesVotes = proposal.votes.filter((v: any) => v.vote === "yes").length
  const noVotes = proposal.votes.filter((v: any) => v.vote === "no").length
  const totalVotes = proposal.votes.length

  // Check if the proposal has passed (simple majority)
  const hasPassed = yesVotes > noVotes && totalVotes > 0

  if (!hasPassed) {
    // Update the proposal status to rejected
    const { error: updateError } = await supabase
      .from("proposals")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)

    if (updateError) {
      console.error("Error updating proposal status:", updateError)
      throw updateError
    }

    return { success: false, message: "Proposal was rejected" }
  }

  // Execute the proposal based on its type
  switch (proposal.type) {
    case "payout_order":
      // Update the payout order based on the execution data
      if (!proposal.execution_data || !proposal.execution_data.new_order) {
        throw new Error("Missing execution data for payout order change")
      }

      // Update each member's position
      for (const item of proposal.execution_data.new_order) {
        const { error: updateError } = await supabase
          .from("pool_members")
          .update({
            position: item.position,
            updated_at: new Date().toISOString(),
          })
          .eq("pool_id", proposal.pool_id)
          .eq("user_id", item.user_id)

        if (updateError) {
          console.error("Error updating member position:", updateError)
          throw updateError
        }
      }
      break

    case "emergency_withdrawal":
      // Process an emergency withdrawal
      if (!proposal.target_user_id || !proposal.execution_data || !proposal.execution_data.amount) {
        throw new Error("Missing execution data for emergency withdrawal")
      }

      // Record the withdrawal as a special payout
      const { error: payoutError } = await supabase.from("payouts").insert({
        pool_id: proposal.pool_id,
        recipient_id: proposal.target_user_id,
        amount: proposal.execution_data.amount,
        token: proposal.pools.contribution_token,
        token_symbol: proposal.pools.contribution_token_symbol,
        transaction_signature: proposal.execution_data.transaction_signature || "emergency_withdrawal",
        status: "confirmed",
        payout_date: new Date().toISOString(),
      })

      if (payoutError) {
        console.error("Error recording emergency withdrawal:", payoutError)
        throw payoutError
      }
      break

    case "extend_pool":
      // Extend the pool duration
      if (!proposal.execution_data || !proposal.execution_data.new_end_date) {
        throw new Error("Missing execution data for pool extension")
      }

      const { error: updatePoolError } = await supabase
        .from("pools")
        .update({
          end_date: proposal.execution_data.new_end_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal.pool_id)

      if (updatePoolError) {
        console.error("Error extending pool:", updatePoolError)
        throw updatePoolError
      }
      break

    case "remove_member":
      // Remove a member from the pool
      if (!proposal.target_user_id) {
        throw new Error("Missing target user for member removal")
      }

      const { error: removeMemberError } = await supabase
        .from("pool_members")
        .update({
          status: "removed",
          updated_at: new Date().toISOString(),
        })
        .eq("pool_id", proposal.pool_id)
        .eq("user_id", proposal.target_user_id)

      if (removeMemberError) {
        console.error("Error removing member:", removeMemberError)
        throw removeMemberError
      }

      // Update the pool's current members count
      const { error: updatePoolMembersError } = await supabase
        .from("pools")
        .update({
          current_members: proposal.pools.current_members - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposal.pool_id)

      if (updatePoolMembersError) {
        console.error("Error updating pool members count:", updatePoolMembersError)
        throw updatePoolMembersError
      }
      break

    case "change_rules":
      // Change pool rules
      if (!proposal.execution_data) {
        throw new Error("Missing execution data for rule change")
      }

      const updates: any = {}

      if (proposal.execution_data.contribution_amount) {
        updates.contribution_amount = proposal.execution_data.contribution_amount
      }

      if (proposal.execution_data.frequency) {
        updates.frequency = proposal.execution_data.frequency
      }

      if (proposal.execution_data.yield_enabled !== undefined) {
        updates.yield_enabled = proposal.execution_data.yield_enabled
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString()

        const { error: updateRulesError } = await supabase.from("pools").update(updates).eq("id", proposal.pool_id)

        if (updateRulesError) {
          console.error("Error updating pool rules:", updateRulesError)
          throw updateRulesError
        }
      }
      break

    default:
      throw new Error(`Unsupported proposal type: ${proposal.type}`)
  }

  // Update the proposal status to executed
  const { error: updateProposalError } = await supabase
    .from("proposals")
    .update({
      status: "executed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId)

  if (updateProposalError) {
    console.error("Error updating proposal status:", updateProposalError)
    throw updateProposalError
  }

  revalidatePath(`/pool/${proposal.pool_id}`)
  revalidatePath(`/vote/${proposal.pool_id}`)

  return { success: true, message: "Proposal executed successfully" }
}
