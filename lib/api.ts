// Mock API and contract interaction helpers
import { type Pool, MOCK_POOLS, type Transaction } from "./solana"

// Create a new pool
export const createPool = async (poolData: Partial<Pool>): Promise<Pool> => {
  try {
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
      slug: poolData.slug || generateSlug(poolData.name || ""),
    }

    // Add to mock pools (in a real app, this would be a database operation)
    MOCK_POOLS.push(newPool)

    return newPool
  } catch (error) {
    console.error("API Error creating pool:", error)
    throw new Error("Failed to create pool. Please check your connection and try again.")
  }
}

// Helper function to generate a slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
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

  // Update the pool in the mock data
  const poolIndex = MOCK_POOLS.findIndex((p) => p.id === poolId)
  if (poolIndex !== -1) {
    MOCK_POOLS[poolIndex] = updatedPool
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

// Process payout for a pool
export const processPoolPayout = async (poolId: string, recipientAddress: string): Promise<Transaction> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const pool = MOCK_POOLS.find((p) => p.id === poolId)
  if (!pool) {
    throw new Error("Pool not found")
  }

  // Calculate payout amount (in a real app, this would be based on pool rules)
  const payoutAmount = pool.contributionAmount * pool.currentMembers

  // Create transaction
  const transaction: Transaction = {
    id: `tx_${Date.now()}`,
    poolId,
    type: "payout",
    amount: payoutAmount,
    token: pool.contributionToken,
    tokenSymbol: pool.contributionTokenSymbol,
    sender: poolId,
    recipient: recipientAddress,
    timestamp: new Date(),
    status: "confirmed",
    signature: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
  }

  // Update the pool's next payout information
  const poolIndex = MOCK_POOLS.findIndex((p) => p.id === poolId)
  if (poolIndex !== -1) {
    // Calculate next payout date based on frequency
    const nextPayoutDate = new Date()
    switch (pool.frequency) {
      case "daily":
        nextPayoutDate.setDate(nextPayoutDate.getDate() + 1)
        break
      case "weekly":
        nextPayoutDate.setDate(nextPayoutDate.getDate() + 7)
        break
      case "biweekly":
        nextPayoutDate.setDate(nextPayoutDate.getDate() + 14)
        break
      case "monthly":
        nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1)
        break
    }

    // Determine next recipient (simple round-robin in this mock)
    const currentRecipientIndex = pool.members.indexOf(recipientAddress)
    const nextRecipientIndex = (currentRecipientIndex + 1) % pool.members.length
    const nextRecipient = pool.members[nextRecipientIndex]

    MOCK_POOLS[poolIndex] = {
      ...pool,
      nextPayoutDate,
      nextPayoutMember: nextRecipient,
    }
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
