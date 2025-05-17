"use client"

import { useEffect, useState } from "react"
import { supabase } from "./supabase/client"
import { useWallet } from '@solana/wallet-adapter-react'

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
  maxMembers?: number
  userPosition?: string
  currentMembers: number
  startDate: Date
  endDate: Date
  nextPayoutDate: Date
  nextPayoutMember: string
  totalContributed: number
  yieldEnabled: boolean
  currentYield?: number
  status: "active" | "pending" | "completed"
  slug?: string
  solana_address?: string | null
  solana_tx_signature?: string | null
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

// Hook to get token balances from blockchain
export const useTokenBalances = () => {
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { publicKey } = useWallet()

  useEffect(() => {
    const fetchBalances = async () => {
      const walletAddress = publicKey?.toBase58()
      if (!walletAddress) {
        setBalances([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        // Here you would integrate with a real Solana wallet provider
        // For now, we'll return some basic tokens that would be available
        const basicTokens: TokenBalance[] = [
          {
            mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            symbol: "USDC",
            name: "USD Coin",
            amount: 0,
            decimals: 6,
            uiAmount: 0,
            logo: "/placeholder.svg?height=24&width=24",
          },
          {
            mint: "So11111111111111111111111111111111111111112",
            symbol: "SOL",
            name: "Solana",
            amount: 0,
            decimals: 9,
            uiAmount: 0,
            logo: "/placeholder.svg?height=24&width=24",
          },
        ]
        setBalances(basicTokens)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching token balances:", err)
        setError("Failed to fetch token balances")
        setIsLoading(false)
      }
    }

    fetchBalances()
  }, [publicKey])

  return { balances, isLoading, error }
}

// Hook to get user pools from Supabase
export const usePools = (walletAddress?: string) => {
  const [pools, setPools] = useState<Pool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { publicKey } = useWallet()

  useEffect(() => {
    const fetchPools = async () => {
      if (!walletAddress || !publicKey) {
        setPools([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Fetch pools from the API, passing wallet address
        const response = await fetch(`/api/pools?wallet_address=${walletAddress}`)
        if (!response.ok) {
          throw new Error("Failed to fetch pools")
        }

        const data = await response.json()

        // Transform the data to match our Pool type
        const transformedPools: Pool[] = data.pools.map((pool: any) => ({
          id: pool.id,
          name: pool.name,
          description: pool.description,
          creator: pool.creator?.wallet_address || "",
          members: pool.pool_members?.map((member: any) => member.user?.wallet_address) || [],
          contributionAmount: pool.contribution_amount,
          contributionToken: pool.contribution_token,
          contributionTokenSymbol: pool.contribution_token_symbol,
          frequency: pool.frequency,
          totalMembers: pool.total_members,
          currentMembers: pool.current_members,
          startDate: new Date(pool.start_date),
          endDate: new Date(pool.end_date),
          nextPayoutDate: new Date(pool.next_payout_date),
          nextPayoutMember: pool.next_payout_member?.wallet_address || "",
          totalContributed: pool.total_contributed,
          yieldEnabled: pool.yield_enabled,
          currentYield: pool.current_yield,
          status: pool.status,
          slug: pool.slug,
          solana_address: pool.solana_address,
          solana_tx_signature: pool.solana_tx_signature,
        }))

        setPools(transformedPools)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching pools:", err)
        setError("Failed to fetch pools")
        setIsLoading(false)
      }
    }

    fetchPools()

    // Set up real-time subscription
    const poolsSubscription = supabase
      .channel("pools-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pools" }, () => {
        fetchPools()
      })
      .subscribe()

    return () => {
      poolsSubscription.unsubscribe()
    }
  }, [walletAddress, publicKey])

  return { pools, isLoading, error }
}

// Hook to get pool details
export const usePoolDetails = (poolId: string) => {
  const [pool, setPool] = useState<Pool | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { publicKey } = useWallet()

  useEffect(() => {
    const fetchPoolDetails = async () => {
      if (!poolId || !publicKey) {
        setPool(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        // Fetch pool details from the API
        const response = await fetch(`/api/pools/${poolId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch pool details")
        }

        const data = await response.json()

        // Transform the data to match our Pool type
        const transformedPool: Pool = {
          id: data.pool.id,
          name: data.pool.name,
          description: data.pool.description,
          creator: data.pool.creator?.wallet_address || "",
          members: data.pool.pool_members?.map((member: any) => member.user?.wallet_address) || [],
          contributionAmount: data.pool.contribution_amount,
          contributionToken: data.pool.contribution_token,
          contributionTokenSymbol: data.pool.contribution_token_symbol,
          frequency: data.pool.frequency,
          totalMembers: data.pool.total_members,
          currentMembers: data.pool.current_members,
          startDate: new Date(data.pool.start_date),
          endDate: new Date(data.pool.end_date),
          nextPayoutDate: new Date(data.pool.next_payout_date),
          nextPayoutMember: data.pool.next_payout_member?.wallet_address || "",
          totalContributed: data.pool.total_contributed,
          yieldEnabled: data.pool.yield_enabled,
          currentYield: data.pool.current_yield,
          status: data.pool.status,
          slug: data.pool.slug,
          solana_address: data.pool.solana_address,
          solana_tx_signature: data.pool.solana_tx_signature,
        }

        setPool(transformedPool)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching pool details:", err)
        setError("Failed to fetch pool details")
        setIsLoading(false)
      }
    }

    fetchPoolDetails()

    // Set up real-time subscription
    const poolSubscription = supabase
      .channel(`pool-${poolId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pools", filter: `id=eq.${poolId}` }, () => {
        fetchPoolDetails()
      })
      .subscribe()

    return () => {
      poolSubscription.unsubscribe()
    }
  }, [poolId, publicKey])

  return { pool, isLoading, error }
}

// Hook to get user transactions
export const useTransactions = (walletAddress?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { publicKey } = useWallet()

  useEffect(() => {
    const fetchTransactions = async () => {
      console.log("[useTransactions] Hook triggered. walletAddress:", walletAddress, "publicKey:", publicKey?.toBase58());

      if (!walletAddress || !publicKey) {
        console.log("[useTransactions] Missing walletAddress or publicKey. Aborting.");
        setTransactions([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true);
        console.log(`[useTransactions] Attempting to fetch user ID for walletAddress: ${walletAddress}`);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', walletAddress)
          .maybeSingle();

        if (userError) {
          console.error(`[useTransactions] Error fetching user ID for ${walletAddress}:`, userError);
          // On missing user, skip fetching transactions
          setTransactions([]);
          setIsLoading(false);
          return;
        }
        if (!userData) {
          console.log(`[useTransactions] No user found for walletAddress: ${walletAddress}. Skipping transactions.`);
          setTransactions([]);
          setIsLoading(false);
          return;
        }
        console.log(`[useTransactions] Successfully fetched user ID: ${userData.id} for walletAddress: ${walletAddress}`);
        
        // Proceed to fetch contributions and payouts even if user ID fetch had issues, to see original errors.
        console.log("[useTransactions] Proceeding to fetch contributions and payouts.");

        // Fetch both contributions and payouts
        const [contributionsRes, payoutsRes] = await Promise.all([
          supabase
            .from("contributions")
            .select(`
              id,
              pool_id,
              user_id,
              amount,
              token,
              token_symbol,
              transaction_signature,
              status,
              created_at,
              pools(id, name)
            `)
            .eq('user_id', userData.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("payouts")
            .select(`
              id,
              pool_id,
              recipient_id,
              amount,
              token,
              token_symbol,
              transaction_signature,
              status,
              payout_date,
              pools(id, name)
            `)
            .eq('recipient_id', userData.id)
            .order("payout_date", { ascending: false }),
        ])

        if (contributionsRes.error) throw contributionsRes.error
        if (payoutsRes.error) throw payoutsRes.error

        // Transform contributions to Transaction type
        const contributionTxs: Transaction[] = (contributionsRes.data || []).map((c: any) => ({
          id: c.id,
          poolId: c.pool_id,
          type: "contribution",
          amount: c.amount,
          token: c.token,
          tokenSymbol: c.token_symbol,
          sender: walletAddress!,
          recipient: c.pools?.name || c.pool_id,
          timestamp: new Date(c.created_at),
          status: c.status,
          signature: c.transaction_signature,
        }))

        // Transform payouts to Transaction type
        const payoutTxs: Transaction[] = (payoutsRes.data || []).map((p: any) => ({
          id: p.id,
          poolId: p.pool_id,
          type: "payout",
          amount: p.amount,
          token: p.token,
          tokenSymbol: p.token_symbol,
          sender: p.pools?.name || p.pool_id,
          recipient: walletAddress!,
          timestamp: new Date(p.payout_date),
          status: p.status,
          signature: p.transaction_signature,
        }))

        // Combine and sort by timestamp
        const allTxs = [...contributionTxs, ...payoutTxs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        setTransactions(allTxs)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError("Failed to fetch transactions")
        setIsLoading(false)
      }
    }

    fetchTransactions()

    // Set up real-time subscriptions
    const contributionsSubscription = supabase
      .channel("contributions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "contributions" }, () => {
        fetchTransactions()
      })
      .subscribe()

    const payoutsSubscription = supabase
      .channel("payouts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "payouts" }, () => {
        fetchTransactions()
      })
      .subscribe()

    return () => {
      contributionsSubscription.unsubscribe()
      payoutsSubscription.unsubscribe()
    }
  }, [walletAddress, publicKey])

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
