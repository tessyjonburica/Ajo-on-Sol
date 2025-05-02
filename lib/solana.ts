"use client"

// Mock Solana wallet and SPL token utilities
import { useState, useEffect } from "react"

// Types
export type TokenBalance = {
  mint: string
  symbol: string
  name: string
  amount: number
  decimals: number
  uiAmount: number
  logo?: string
}

export type Pool = {
  id: string
  name: string
  description: string
  creator: string
  members: string[]
  contributionAmount: number
  contributionToken: string
  contributionTokenSymbol: string
  frequency: "daily" | "weekly" | "biweekly" | "monthly"
  totalMembers: number
  currentMembers: number
  startDate: Date
  endDate: Date
  nextPayoutDate: Date
  nextPayoutMember: string
  totalContributed: number
  yieldEnabled: boolean
  currentYield?: number
  status: "active" | "pending" | "completed"
}

export type Transaction = {
  id: string
  poolId: string
  type: "contribution" | "payout" | "yield" | "withdrawal"
  amount: number
  token: string
  tokenSymbol: string
  sender: string
  recipient: string
  timestamp: Date
  status: "confirmed" | "pending" | "failed"
  signature: string
}

// Mock token balances
const MOCK_TOKENS: TokenBalance[] = [
  {
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    amount: 1000000000, // 1000 USDC in raw units
    decimals: 6,
    uiAmount: 1000,
    logo: "/placeholder.svg?height=24&width=24",
  },
  {
    mint: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    amount: 5000000000, // 5 SOL in raw units
    decimals: 9,
    uiAmount: 5,
    logo: "/placeholder.svg?height=24&width=24",
  },
]

// Mock pools
export const MOCK_POOLS: Pool[] = [
  {
    id: "pool_1",
    name: "Lagos Traders Group",
    description: "Weekly savings pool for Lagos market traders",
    creator: "GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL",
    members: ["GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL", "..."],
    contributionAmount: 50,
    contributionToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    contributionTokenSymbol: "USDC",
    frequency: "weekly",
    totalMembers: 10,
    currentMembers: 8,
    startDate: new Date("2023-12-01"),
    endDate: new Date("2024-02-28"),
    nextPayoutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    nextPayoutMember: "GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL",
    totalContributed: 1600,
    yieldEnabled: true,
    currentYield: 2.5,
    status: "active",
  },
  {
    id: "pool_2",
    name: "Abuja Family Circle",
    description: "Monthly savings for extended family members",
    creator: "Dv2c4dvAL4V7coZEbS6fMrSyMDMzRxKyuQGkzzKZ42Wu",
    members: ["GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL", "..."],
    contributionAmount: 100,
    contributionToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    contributionTokenSymbol: "USDC",
    frequency: "monthly",
    totalMembers: 12,
    currentMembers: 12,
    startDate: new Date("2023-11-15"),
    endDate: new Date("2024-11-15"),
    nextPayoutDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    nextPayoutMember: "Dv2c4dvAL4V7coZEbS6fMrSyMDMzRxKyuQGkzzKZ42Wu",
    totalContributed: 2400,
    yieldEnabled: false,
    status: "active",
  },
  {
    id: "pool_3",
    name: "Tech Startup Fund",
    description: "Biweekly pool for tech entrepreneurs",
    creator: "GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL",
    members: ["GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL", "..."],
    contributionAmount: 0.5,
    contributionToken: "So11111111111111111111111111111111111111112",
    contributionTokenSymbol: "SOL",
    frequency: "biweekly",
    totalMembers: 6,
    currentMembers: 4,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-06-30"),
    nextPayoutDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    nextPayoutMember: "5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CertuqDcKij",
    totalContributed: 8,
    yieldEnabled: true,
    currentYield: 4.2,
    status: "active",
  },
]

// Mock transactions
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    poolId: "pool_1",
    type: "contribution",
    amount: 50,
    token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenSymbol: "USDC",
    sender: "GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL",
    recipient: "pool_1",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: "confirmed",
    signature: "5UJpxLXKQmwxQsLo9JyktV5CZ6yXMPsJN6RYbLaEcLT3TxzPuNgRuTQmQTE9k7n4aNfFm1Cv",
  },
  {
    id: "tx_2",
    poolId: "pool_2",
    type: "contribution",
    amount: 100,
    token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenSymbol: "USDC",
    sender: "GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL",
    recipient: "pool_2",
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    status: "confirmed",
    signature: "2UJpxLXKQmwxQsLo9JyktV5CZ6yXMPsJN6RYbLaEcLT3TxzPuNgRuTQmQTE9k7n4aNfFm1Cv",
  },
  {
    id: "tx_3",
    poolId: "pool_1",
    type: "payout",
    amount: 400,
    token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenSymbol: "USDC",
    sender: "pool_1",
    recipient: "5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CertuqDcKij",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    status: "confirmed",
    signature: "3UJpxLXKQmwxQsLo9JyktV5CZ6yXMPsJN6RYbLaEcLT3TxzPuNgRuTQmQTE9k7n4aNfFm1Cv",
  },
]

// Hook to get token balances
export const useTokenBalances = () => {
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setBalances(MOCK_TOKENS)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to fetch token balances")
        setIsLoading(false)
      }
    }

    fetchBalances()
  }, [])

  return { balances, isLoading, error }
}

// Hook to get user pools
export const usePools = (walletAddress?: string) => {
  const [pools, setPools] = useState<Pool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPools = async () => {
      if (!walletAddress) {
        setPools([])
        setIsLoading(false)
        return
      }

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1800))
        // Filter pools where user is a member
        const userPools = MOCK_POOLS.filter((pool) => pool.members.includes(walletAddress))
        setPools(userPools)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to fetch pools")
        setIsLoading(false)
      }
    }

    fetchPools()
  }, [walletAddress])

  return { pools, isLoading, error }
}

// Hook to get pool details
export const usePoolDetails = (poolId: string) => {
  const [pool, setPool] = useState<Pool | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPoolDetails = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1200))
        const foundPool = MOCK_POOLS.find((p) => p.id === poolId) || null
        setPool(foundPool)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to fetch pool details")
        setIsLoading(false)
      }
    }

    fetchPoolDetails()
  }, [poolId])

  return { pool, isLoading, error }
}

// Hook to get user transactions
export const useTransactions = (walletAddress?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!walletAddress) {
        setTransactions([])
        setIsLoading(false)
        return
      }

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))
        // Filter transactions where user is sender or recipient
        const userTransactions = MOCK_TRANSACTIONS.filter(
          (tx) => tx.sender === walletAddress || tx.recipient === walletAddress,
        )
        setTransactions(userTransactions)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to fetch transactions")
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [walletAddress])

  return { transactions, isLoading, error }
}

// Function to format wallet address
export const formatWalletAddress = (address: string): string => {
  if (!address) return ""
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

// Function to format amount with token symbol
export const formatAmount = (amount: number, symbol: string): string => {
  return `${amount.toLocaleString()} ${symbol}`
}
