import { createServerSupabaseClient } from "./supabase/client";
import { notFound } from "next/navigation";

export async function getPoolById(poolId: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("pools")
    .select(`
      *,
      creator:creator_id(id, display_name, wallet_address, avatar_url),
      next_payout_member:next_payout_member_id(id, display_name, wallet_address, avatar_url),
      pool_members(
        *,
        user:user_id(id, display_name, wallet_address, avatar_url)
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
    solana_address: data.solana_address,
    solana_tx_signature: data.solana_tx_signature
  };
}

export async function getPoolProposals(poolId: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("proposals")
    .select(`
      *,
      proposer:proposer_id(id, display_name, wallet_address, avatar_url),
      target_user:target_user_id(id, display_name, wallet_address, avatar_url),
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

/**
 * Creates a new pool by calling the /api/pools endpoint
 * Now returns both the pool data and the transaction that needs to be signed
 */
export async function createPool(poolData: any) {
  const response = await fetch('/api/pools', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(poolData),
  });
  
  const json = await response.json();
  
  if (!response.ok) {
    console.error('Error creating pool via API:', json);
    throw new Error(json.error || 'Failed to create pool');
  }
  
  // Return both the pool and the transaction (if available)
  return {
    pool: json.pool,
    transaction: json.transaction,
    poolAddress: json.poolAddress
  };
}

/**
 * Submit a signed transaction to complete pool creation
 */
export async function submitPoolTransaction(poolId: string, signedTransaction: string) {
  const response = await fetch('/api/transactions/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      poolId,
      signedTransaction,
    }),
  });
  
  const json = await response.json();
  
  if (!response.ok) {
    console.error('Error submitting transaction:', json);
    throw new Error(json.error || 'Failed to submit transaction');
  }
  
  return json;
}

/**
 * Vote on a proposal by calling the /api/proposal/[id]/vote endpoint
 */
export async function voteOnProposal(poolId: string, proposalId: string, walletAddress: string, vote: string) {
  const response = await fetch(`/api/proposal/${proposalId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'wallet-address': walletAddress,
    },
    body: JSON.stringify({ vote }),
  });
  const json = await response.json();
  if (!response.ok) {
    console.error('Error voting on proposal via API:', json);
    throw new Error(json.error || 'Failed to vote on proposal');
  }
  return json;
}

// Add a function to verify pool status and wallet balance
export async function verifyPoolStatus(poolAddress: string, walletAddress?: string) {
  try {
    let url = `/api/pools/verify?poolAddress=${poolAddress}`
    if (walletAddress) {
      url += `&walletAddress=${walletAddress}`
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to verify pool: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error("Error verifying pool status:", error)
    throw error
  }
}

/**
 * Submit a contribution to a pool
 */
export async function contributeToPool(poolId: string, amount: number, tokenSymbol: string) {
  const response = await fetch(`/api/pools/${poolId}/contribute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      tokenSymbol
    }),
  });
  
  const json = await response.json();
  
  if (!response.ok) {
    console.error('Error contributing to pool:', json);
    throw new Error(json.error || 'Failed to process contribution');
  }
  
  return json;
}
