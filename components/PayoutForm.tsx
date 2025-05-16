import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSolBalance } from '@/lib/solana/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon, AlertCircle, CheckCircle } from 'lucide-react'
import { calculateNextPayoutDate } from '@/lib/utils/dates'

interface PayoutFormProps {
  poolId: string
  poolAddress: string
  contributionAmount: number
  nextPayoutDate: string
  tokenSymbol: string
  userPosition: number
  startDate: string
  frequency: "daily" | "weekly" | "biweekly" | "monthly"
}

export default function PayoutForm({
  poolId,
  poolAddress,
  contributionAmount,
  nextPayoutDate,
  tokenSymbol = 'SOL',
  userPosition,
  startDate,
  frequency
}: PayoutFormProps) {
  const { publicKey, connected } = useWallet()
  const [poolBalance, setPoolBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payoutInfo, setPayoutInfo] = useState<any>(null)
  
  // Calculate expected payout amount (5 members for testing)
  const expectedPayoutAmount = contributionAmount * 5

  // Calculate the correct next payout date based on frequency and position
  const calculatedNextPayoutDate = calculateNextPayoutDate(new Date(startDate), frequency, userPosition)
  
  // Format the next payout date using the calculated date
  const formattedNextPayoutDate = calculatedNextPayoutDate ? formatDate(calculatedNextPayoutDate) : 'Not set'

  useEffect(() => {
    async function fetchPoolBalance() {
      if (poolAddress) {
        try {
          const balance = await getSolBalance(poolAddress)
          setPoolBalance(balance)
        } catch (err) {
          console.error('Error fetching pool balance:', err)
          setPoolBalance(0)
        }
      }
    }
    
    fetchPoolBalance()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPoolBalance, 30000)
    
    return () => clearInterval(interval)
  }, [poolAddress])

  const handleTestPayout = async () => {
    if (!publicKey) {
      setError('Please connect your wallet')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const response = await fetch(`/api/pools/${poolId}/test-payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          payoutDate: calculatedNextPayoutDate.toISOString()
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to process test payout')
      }
      
      setSuccess(true)
      setPayoutInfo(data)
      
      // Refresh the pool balance
      if (poolAddress) {
        const balance = await getSolBalance(poolAddress)
        setPoolBalance(balance)
      }
    } catch (err: any) {
      console.error('Error processing test payout:', err)
      setError(err.message || 'Failed to process test payout')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Payout</CardTitle>
        <CardDescription>
          Test the payout functionality for your next scheduled payout
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <div className="text-sm text-muted-foreground">Pool Balance</div>
            <p className="font-medium">
              {poolBalance !== null ? `${poolBalance.toFixed(4)} ${tokenSymbol}` : 'Loading...'}
            </p>
          </div>
          
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <div className="text-sm text-muted-foreground">Expected Payout</div>
            <p className="font-medium">
              {expectedPayoutAmount.toFixed(4)} {tokenSymbol}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <div className="text-sm text-muted-foreground">Next Scheduled Payout Date</div>
          <p className="font-medium">{formattedNextPayoutDate}</p>
        </div>

        {userPosition && (
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <div className="text-sm text-muted-foreground">Your Position</div>
            <p className="font-medium">{userPosition}</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Test payout processed successfully!
              {payoutInfo && (
                <div className="mt-2">
                  <p>Amount: {payoutInfo.payoutAmount} {tokenSymbol}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 flex gap-2">
          <InfoIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">This is a test feature</p>
            <p className="text-sm">
              In a production environment, payouts would be automatically processed on the scheduled date.
              This test feature allows you to simulate receiving your payout without waiting.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleTestPayout} 
          disabled={isLoading || !connected || (poolBalance !== null && poolBalance < expectedPayoutAmount)}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Test My Payout'}
        </Button>
      </CardFooter>
    </Card>
  )
} 