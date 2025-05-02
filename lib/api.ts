// Mock API and contract interaction helpers
import { type Pool, MOCK_POOLS, type Transaction } from "./solana"

// Create a new pool
export const createPool = async (poolData: Partial<Pool>): Promise<Pool> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const newPool: Pool = {
    id: `pool_${Date.now()}`,
    name: poolData.name || "Unnamed Pool",
    description: poolData.description || "",
    creator: poolData.creator || "",
    members: poolData.members || [],
    contributionAmount: poolData.contributionAmount || 0,
    contributionToken: poolData.contributionToken || "",
    contributionTokenSymbol: poolData.contributionTokenSymbol || "",
    frequency: poolData.frequency || "weekly",
    totalMembers: poolData.totalMembers || 0,
    currentMembers: poolData.members?.length || 0,
    startDate: poolData.startDate || new Date(),
    endDate: poolData.endDate || new Date(),
    nextPayoutDate: poolData.nextPayoutDate || new Date(),
    nextPayoutMember: poolData.nextPayoutMember || "",
    totalContributed: 0,
    yieldEnabled: poolData.yieldEnabled || false,
    currentYield: poolData.yieldEnabled ? 2.5 : undefined,
    status: "pending",
  }

  return newPool
}

// Join an existing pool
export const joinPool = async (poolId: string, walletAddress: string): Promise<Pool> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const pool = MOCK_POOLS.find((p) => p.id === poolId)
  if (!pool) {
    throw new Error("Pool not found")
  }

  // Check if user is already a member
  if (pool.members.includes(walletAddress)) {
    throw new Error("Already a member of this pool")
  }

  // Add user to pool members
  const updatedPool = {
    ...pool,
    members: [...pool.members, walletAddress],
    currentMembers: pool.currentMembers + 1,
  }

  return updatedPool
}

// Make a contribution to a pool
export const contributeToPool = async (poolId: string, walletAddress: string, amount: number): Promise<Transaction> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const pool = MOCK_POOLS.find((p) => p.id === poolId)
  if (!pool) {
    throw new Error("Pool not found")
  }

  // Create transaction
  const transaction: Transaction = {
    id: `tx_${Date.now()}`,
    poolId,
    type: "contribution",
    amount,
    token: pool.contributionToken,
    tokenSymbol: pool.contributionTokenSymbol,
    sender: walletAddress,
    recipient: poolId,
    timestamp: new Date(),
    status: "confirmed",
    signature: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
  }

  return transaction
}

// Vote on a pool proposal
export const voteOnProposal = async (
  poolId: string,
  proposalId: string,
  walletAddress: string,
  vote: "yes" | "no",
): Promise<boolean> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const pool = MOCK_POOLS.find((p) => p.id === poolId)
  if (!pool) {
    throw new Error("Pool not found")
  }

  // Check if user is a member
  if (!pool.members.includes(walletAddress)) {
    throw new Error("Not a member of this pool")
  }

  // Return vote result (always successful in mock)
  return true
}

// Withdraw from a pool (emergency withdrawal)
export const withdrawFromPool = async (poolId: string, walletAddress: string, amount: number): Promise<Transaction> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2500))

  const pool = MOCK_POOLS.find((p) => p.id === poolId)
  if (!pool) {
    throw new Error("Pool not found")
  }

  // Create transaction
  const transaction: Transaction = {
    id: `tx_${Date.now()}`,
    poolId,
    type: "withdrawal",
    amount,
    token: pool.contributionToken,
    tokenSymbol: pool.contributionTokenSymbol,
    sender: poolId,
    recipient: walletAddress,
    timestamp: new Date(),
    status: "confirmed",
    signature: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
  }

  return transaction
}

// Get pool proposals
export type Proposal = {
  id: string
  poolId: string
  title: string
  description: string
  proposer: string
  type: "payout_order" | "emergency_withdrawal" | "extend_pool" | "change_rules"
  options: string[]
  votes: Record<string, number>
  status: "active" | "passed" | "rejected"
  createdAt: Date
  endsAt: Date
}

export const getPoolProposals = async (poolId: string): Promise<Proposal[]> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock proposals
  const proposals: Proposal[] = [
    {
      id: "proposal_1",
      poolId,
      title: "Change Payout Order",
      description: "Proposal to change the payout order due to emergency needs of member 3",
      proposer: "GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL",
      type: "payout_order",
      options: ["Approve", "Reject"],
      votes: { Approve: 5, Reject: 2 },
      status: "active",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: "proposal_2",
      poolId,
      title: "Emergency Withdrawal Request",
      description: "Member requests emergency withdrawal due to medical expenses",
      proposer: "5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CertuqDcKij",
      type: "emergency_withdrawal",
      options: ["Approve", "Reject"],
      votes: { Approve: 3, Reject: 4 },
      status: "active",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  ]

  return proposals
}
