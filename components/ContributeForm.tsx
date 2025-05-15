"use client"

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { contributeToPool } from '@/lib/api'

interface ContributeFormProps {
  poolId: string
  contributionAmount: number
  contributionToken: string
  contributionTokenSymbol: string
}

export default function ContributeForm({
  poolId,
  contributionAmount,
  contributionToken,
  contributionTokenSymbol
}: ContributeFormProps) {
  const { publicKey, connected, signTransaction } = useWallet()
  const [amount, setAmount] = useState(contributionAmount.toString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Check wallet balance on load and when wallet changes
  useEffect(() => {
    const checkBalance = async () => {
      if (!publicKey || !connected) {
        setWalletBalance(null)
        return
      }

      try {
        // Log wallet connection state
        console.log("Wallet connection state:", {
          connected,
          publicKey: publicKey.toBase58(),
          hasSignTransaction: !!signTransaction
        })

        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
        )

        // Check if we're looking for SOL or another token
        if (contributionTokenSymbol.toUpperCase() === 'SOL') {
          // Get SOL balance
          const balance = await connection.getBalance(publicKey)
          const solBalance = balance / LAMPORTS_PER_SOL
          setWalletBalance(solBalance)
          console.log("SOL Balance:", solBalance)
          
          setDebugInfo(prev => ({
            ...prev,
            tokenType: "SOL",
            actualBalance: solBalance,
            requiredAmount: contributionAmount
          }))
        } else {
          // For other tokens like USDC, we'd need to check token accounts
          console.log("Checking for token:", contributionTokenSymbol)
          console.log("Token mint address:", contributionToken)
          
          // This is simplified - in a real app you'd check token accounts
          setWalletBalance(0) // Placeholder for now
          
          setDebugInfo(prev => ({
            ...prev,
            tokenType: contributionTokenSymbol,
            tokenAddress: contributionToken,
            requiredAmount: contributionAmount
          }))
        }
      } catch (err) {
        console.error("Error checking balance:", err)
        setError("Failed to check wallet balance")
      }
    }

    checkBalance()
  }, [publicKey, connected, contributionToken, contributionTokenSymbol, contributionAmount, signTransaction])

  const handleContribute = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("Starting contribution process...")
      console.log("Debug info:", debugInfo)
      
      if (!publicKey || !connected) {
        throw new Error("Wallet not connected")
      }
      
      if (!signTransaction) {
        throw new Error("Wallet doesn't support signing")
      }

      // Add debug logging for wallet state
      console.log("Wallet state before API call:", {
        publicKey: publicKey?.toBase58(),
        isConnected: connected,
        hasSignTransaction: !!signTransaction,
        walletBalance
      });
      
      // Check if we have enough balance
      if (walletBalance !== null && walletBalance < parseFloat(amount)) {
        throw new Error(`Insufficient ${contributionTokenSymbol} balance`)
      }
      
      // Step 1: Get the transaction from the server
      const response = await fetch(`/api/pools/${poolId}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicKey.toBase58()}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          tokenSymbol: contributionTokenSymbol,
          walletAddress: publicKey.toBase58()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to prepare contribution');
      }
      
      const data = await response.json();
      console.log("Contribution transaction prepared:", data);
      
      // Step 2: Sign the transaction
      const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'));
      console.log("Signing transaction...");

      // Get a fresh blockhash right before signing
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
      );
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      
      const signedTransaction = await signTransaction(transaction);
      
      // Step 3: Send the signed transaction
      console.log("Submitting transaction to network...");
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3
        }
      );
      
      console.log("Transaction submitted:", signature);
      
      // Wait for confirmation with more detailed error handling
      console.log("Waiting for confirmation...");
      try {
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        });
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        console.log("Transaction confirmed:", signature);
        
        // Record the contribution in our database
        const recordResponse = await fetch(`/api/pools/${poolId}/record-contribution`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicKey.toBase58()}`
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            transactionSignature: signature,
            walletAddress: publicKey.toBase58(),
            tokenSymbol: contributionTokenSymbol
          })
        });

        if (!recordResponse.ok) {
          const errorData = await recordResponse.json();
          console.error("Failed to record contribution:", errorData);
          throw new Error(errorData.error || errorData.details || "Transaction confirmed but failed to record contribution");
        }

        const recordData = await recordResponse.json();
        console.log("Contribution recorded:", recordData);
        
        // Show success message
        alert(`Contribution successful! Transaction: ${signature}`);
        
        // Refresh the page to update the UI
        window.location.reload();
      } catch (err: any) {
        console.error("Contribution error:", err)
        setError(err.message || "Failed to process contribution")
      }
    } catch (err: any) {
      console.error("Contribution error:", err)
      setError(err.message || "Failed to process contribution")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make a Contribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Required Contribution</span>
              <span className="font-medium">{contributionAmount} {contributionTokenSymbol}</span>
            </div>
            
            {walletBalance !== null && (
              <div className="flex items-center justify-between text-sm">
                <span>Your Balance</span>
                <span>{walletBalance} {contributionTokenSymbol}</span>
              </div>
            )}
            
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2"
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleContribute} 
            disabled={isLoading || !connected || !walletBalance}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Contribute"}
          </Button>
          
          {/* Debug information */}
          {Object.keys(debugInfo).length > 0 && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <div className="font-medium mb-1">Debug Info:</div>
              <pre className="overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 