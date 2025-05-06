"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { getSolBalance, getTokenBalance } from "./client"

// Hook to get the SOL balance for the current user
export function useSolBalance() {
  const { user } = usePrivy()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      if (!user?.wallet?.address) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const solBalance = await getSolBalance(user.wallet.address)
        setBalance(solBalance)
        setError(null)
      } catch (err) {
        console.error("Error fetching SOL balance:", err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [user?.wallet?.address])

  return { balance, isLoading, error }
}

// Hook to get the token balance for the current user
export function useTokenBalance(tokenMint: string) {
  const { user } = usePrivy()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      if (!user?.wallet?.address || !tokenMint) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const tokenBalance = await getTokenBalance(user.wallet.address, tokenMint)
        setBalance(tokenBalance)
        setError(null)
      } catch (err) {
        console.error("Error fetching token balance:", err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [user?.wallet?.address, tokenMint])

  return { balance, isLoading, error }
}

// Hook to get multiple token balances for the current user
export function useTokenBalances(tokenMints: string[]) {
  const { user } = usePrivy()
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchBalances() {
      if (!user?.wallet?.address || !tokenMints.length) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const balancePromises = tokenMints.map((mint) =>
          getTokenBalance(user.wallet.address!, mint)
            .then((balance) => ({ mint, balance }))
            .catch((err) => {
              console.error(`Error fetching balance for ${mint}:`, err)
              return { mint, balance: 0 }
            }),
        )

        const results = await Promise.all(balancePromises)
        const balanceMap = results.reduce(
          (acc, { mint, balance }) => {
            acc[mint] = balance
            return acc
          },
          {} as Record<string, number>,
        )

        setBalances(balanceMap)
        setError(null)
      } catch (err) {
        console.error("Error fetching token balances:", err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalances()
  }, [user?.wallet?.address, tokenMints])

  return { balances, isLoading, error }
}
