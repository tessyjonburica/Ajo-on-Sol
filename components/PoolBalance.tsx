import { useState, useEffect } from 'react'
import { getSolBalance } from '@/lib/solana/client'

interface PoolBalanceProps {
  poolAddress: string
  tokenSymbol: string
}

export default function PoolBalance({ poolAddress, tokenSymbol = 'SOL' }: PoolBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      if (!poolAddress) {
        setBalance(0)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const bal = await getSolBalance(poolAddress)
        setBalance(bal)
        setError(null)
      } catch (err) {
        console.error('Error fetching pool balance:', err)
        setError('Failed to load balance')
        setBalance(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    
    return () => clearInterval(interval)
  }, [poolAddress])

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">Error loading balance</p>
  }

  return (
    <p className="text-sm text-muted-foreground">
      {balance !== null ? `${balance.toFixed(4)} ${tokenSymbol}` : '0 ' + tokenSymbol}
    </p>
  )
} 