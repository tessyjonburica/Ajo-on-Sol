"use client"

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { verifyPoolStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface PoolVerifierProps {
  poolAddress: string
}

export default function PoolVerifier({ poolAddress }: PoolVerifierProps) {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const verifyPool = async () => {
    if (!poolAddress) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const walletAddress = publicKey?.toBase58()
      const verificationResult = await verifyPoolStatus(poolAddress, walletAddress)
      setResult(verificationResult)
    } catch (err: any) {
      console.error("Verification error:", err)
      setError(err.message || "Failed to verify pool status")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Pool Verification</CardTitle>
        <CardDescription>Verify pool on-chain status and wallet balance</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={verifyPool} 
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? "Verifying..." : "Verify Pool & Balance"}
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2 p-2 border rounded">
              <div className="font-medium">Pool exists on-chain:</div>
              <div>{result.existsOnChain ? "Yes ✅" : "No ❌"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 p-2 border rounded">
              <div className="font-medium">Actual SOL balance:</div>
              <div>{result.solBalance !== null ? `${result.solBalance} SOL` : "Not checked"}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 p-2 border rounded">
              <div className="font-medium">Pool status in DB:</div>
              <div>{result.poolData?.status || "Unknown"}</div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>If your pool exists on-chain but the app shows 0 SOL, there might be a connection issue between your wallet and the app.</p>
              <p className="mt-1">Try disconnecting and reconnecting your wallet, or switching to the correct network (Testnet).</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 