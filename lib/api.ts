import { createServerSupabaseClient } from "./supabase/client";
import { notFound } from "next/navigation";

export async function getPoolById(poolId: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
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
    .eq("id", poolId)
    .single();

  if (error || !data) {
    console.error("Error fetching pool:", error);
    return notFound();
  }

  // Transform the data to match our Pool type
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    creator: data.creator?.wallet_address || "",
    creatorName: data.creator?.display_name,
    creatorAvatar: data.creator?.avatar_url,
    members:
      data.pool_members?.map((member: any) => ({
        id: member.user?.id,
        address: member.user?.wallet_address,
        name: member.user?.display_name,
        avatar: member.user?.avatar_url,
        position: member.position,
        hasReceivedPayout: member.has_received_payout,
        totalContributed: member.total_contributed,
        status: member.status,
      })) || [],
    contributionAmount: data.contribution_amount,
    contributionToken: data.contribution_token,
    contributionTokenSymbol: data.contribution_token_symbol,
    frequency: data.frequency,
    totalMembers: data.total_members,
    currentMembers: data.current_members,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    nextPayoutDate: new Date(data.next_payout_date),
    nextPayoutMember: data.next_payout_member?.wallet_address || "",
    nextPayoutMemberName: data.next_payout_member?.display_name,
    nextPayoutMemberAvatar: data.next_payout_member?.avatar_url,
    totalContributed: data.total_contributed,
    yieldEnabled: data.yield_enabled,
    currentYield: data.current_yield,
    status: data.status,
    slug: data.slug,
  };
}

export async function getPoolProposals(poolId: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("proposals")
    .select(`
      *,
      proposer:proposer_id(id, privy_id, display_name, wallet_address, avatar_url),
      target_user:target_user_id(id, privy_id, display_name, wallet_address, avatar_url),
      votes(*)
    `)
    .eq("pool_id", poolId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching proposals:", error);
    throw error;
  }

  return data || [];
}

export async function getUserVoteOnProposal(proposalId: string, userId: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("proposal_id", proposalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user vote:", error);
    return null;
  }

  return data;
}
