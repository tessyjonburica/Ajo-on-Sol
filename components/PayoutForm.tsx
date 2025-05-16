import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSolBalance, executePayoutTransaction } from '@/lib/solana/client'
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
  currentMembers: number
  totalMembers: number
}

export default function PayoutForm({
  poolId,
  poolAddress,
  contributionAmount,
  nextPayoutDate,
  tokenSymbol = 'SOL',
  userPosition,
  startDate,
  frequency,
  currentMembers,
  totalMembers
}: PayoutFormProps) {
  const { publicKey, connected, signTransaction } = useWallet()
  const [poolBalance, setPoolBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payoutInfo, setPayoutInfo] = useState<any>(null)
  const [actualUserPosition, setActualUserPosition] = useState<number | null>(null)
  
  // Calculate expected payout amount based on actual members
  const expectedPayoutAmount = contributionAmount * totalMembers

  // Calculate the correct next payout date based on frequency and position
  const calculatedNextPayoutDate = calculateNextPayoutDate(new Date(startDate), frequency, userPosition)
  
  // Format the next payout date using the calculated date
  const formattedNextPayoutDate = calculatedNextPayoutDate ? formatDate(calculatedNextPayoutDate) : 'Not set'

  // Debug logging
  useEffect(() => {
    console.log('PayoutForm Debug:', {
      poolId,
      poolAddress,
      contributionAmount,
      userPosition,
      actualUserPosition,
      currentMembers,
      totalMembers,
      connected,
      poolBalance,
      expectedPayoutAmount,
      walletAddress: publicKey?.toString(),
      isButtonDisabled: 
        !connected || 
        (actualUserPosition !== null ? actualUserPosition !== 1 : userPosition !== 1) || 
        currentMembers < totalMembers ||
        (poolBalance !== null && poolBalance < expectedPayoutAmount)
    });
  }, [poolId, poolAddress, contributionAmount, userPosition, actualUserPosition, currentMembers, totalMembers, connected, poolBalance, expectedPayoutAmount, publicKey]);

  // Fetch user's actual position from the API
  useEffect(() => {
    async function fetchUserPosition() {
      if (!publicKey || !poolId) return;
      
      try {
        const response = await fetch(`/api/pools/${poolId}/user-position?wallet_address=${publicKey.toString()}`);
        if (response.ok) {
          const data = await response.json();
          console.log('User position API response:', data);
          if (data.position) {
            setActualUserPosition(data.position);
          }
        } else {
          console.error('Failed to fetch user position');
        }
      } catch (err) {
        console.error('Error fetching user position:', err);
      }
    }
    
    fetchUserPosition();
  }, [poolId, publicKey]);

  useEffect(() => {
    async function fetchPoolBalance() {
      if (!poolAddress) {
        console.error('Pool address not found')
        setError('Pool address not found. Please contact support.')
        setPoolBalance(0)
        return
      }

      try {
        setIsLoading(true)
        const balance = await getSolBalance(poolAddress)
        setPoolBalance(balance)
        setError(null)
      } catch (err) {
        console.error('Error fetching pool balance:', err)
        setError('Failed to fetch pool balance. Please try again.')
        setPoolBalance(0)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPoolBalance()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPoolBalance, 30000)
    
    return () => clearInterval(interval)
  }, [poolAddress])

  const handlePayout = async () => {
    if (!publicKey) {
      setError('Please connect your wallet')
      return
    }

    if (!poolAddress) {
      setError('Pool address not found. Please contact support.')
      return
    }

    if (!signTransaction) {
      setError('Wallet does not support transaction signing')
      return
    }

    // Use actualUserPosition if available, otherwise fall back to userPosition
    const effectivePosition = actualUserPosition !== null ? actualUserPosition : userPosition;

    // Validate user is in position 1 (creator)
    if (effectivePosition !== 1) {
      setError('Only the pool creator can request payouts')
      return
    }

    // Validate all members have joined
    if (currentMembers < totalMembers) {
      setError(`Waiting for ${totalMembers - currentMembers} more members to join`)
      return
    }

    // Validate pool has enough balance
    if (poolBalance === null) {
      setError('Loading pool balance...')
      return
    }
    
    if (poolBalance < expectedPayoutAmount) {
      setError(`Insufficient pool balance. Required: ${expectedPayoutAmount} ${tokenSymbol}`)
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      // First, get transaction data from the API
      const response = await fetch(`/api/pools/${poolId}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: publicKey.toString(),
          payoutDate: calculatedNextPayoutDate.toISOString(),
          poolAddress
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to process payout')
      }
      
      // If we have transaction data, process the on-chain payout
      if (data.transactionData) {
        const { recipientAddress, amount } = data.transactionData
        
        try {
          // Execute the payout transaction using the wallet adapter
          const signature = await executePayoutTransaction(
            {
              publicKey,
              signTransaction
            },
            poolAddress,
            recipientAddress,
            amount
          )
          
          // Submit the transaction signature back to the API
          const confirmResponse = await fetch(`/api/pools/${poolId}/payout/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              wallet_address: publicKey.toString(),
              transactionSignature: signature,
              payoutDate: calculatedNextPayoutDate.toISOString()
            }),
          })
          
          if (!confirmResponse.ok) {
            const confirmData = await confirmResponse.json()
            throw new Error(confirmData.error || confirmData.details || 'Failed to confirm payout')
          }
          
          const confirmData = await confirmResponse.json()
          
          setSuccess(true)
          setPayoutInfo({
            payoutAmount: amount,
            transactionSignature: signature
          })
        } catch (err: any) {
          console.error('Error processing on-chain payout:', err)
          setError(err.message || 'Failed to process on-chain payout')
          return
        }
      } else {
        // If no transaction data was returned, assume success
        setSuccess(true)
        setPayoutInfo(data)
      }
      
      // Refresh the pool balance
      if (poolAddress) {
        const balance = await getSolBalance(poolAddress)
        setPoolBalance(balance)
      }
    } catch (err: any) {
      console.error('Error processing payout:', err)
      setError(err.message || 'Failed to process payout')
    } finally {
      setIsLoading(false)
    }
  }

  // Use actualUserPosition if available, otherwise fall back to userPosition
  const effectivePosition = actualUserPosition !== null ? actualUserPosition : userPosition;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Payout</CardTitle>
        <CardDescription>
          Process payout for the current cycle when conditions are met
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

        <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <div className="text-sm text-muted-foreground">Members</div>
          <p className="font-medium">{currentMembers} of {totalMembers}</p>
        </div>

        {effectivePosition && (
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <div className="text-sm text-muted-foreground">Your Position</div>
            <p className="font-medium">{effectivePosition}</p>
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
              Payout processed successfully!
              {payoutInfo && (
                <div className="mt-2">
                  <p>Amount: {payoutInfo.payoutAmount} {tokenSymbol}</p>
                  {payoutInfo.transactionSignature && (
                    <p className="mt-1">
                      <a 
                        href={`https://explorer.solana.com/tx/${payoutInfo.transactionSignature}?cluster=devnet`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View transaction
                      </a>
                    </p>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 flex gap-2">
          <InfoIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payout Requirements</p>
            <div className="text-sm">
              To process a payout:
            </div>
            <ul className="list-disc list-inside mt-1 text-sm">
              <li>You must be the pool creator (position 1)</li>
              <li>All {totalMembers} members must have joined</li>
              <li>Pool balance must be {expectedPayoutAmount} {tokenSymbol}</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePayout} 
          disabled={
            isLoading || 
            !connected || 
            effectivePosition !== 1 || 
            currentMembers < totalMembers ||
            (poolBalance !== null && poolBalance < expectedPayoutAmount)
          }
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Request Payout'}
        </Button>
      </CardFooter>
    </Card>
  )
} 