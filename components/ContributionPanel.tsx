"use client"

import { useState } from "react"
import { useWallet } from '@solana/wallet-adapter-react'
import { contributeToAjoPool } from "@/lib/solana/ajo-contract"
import type { Pool } from "@/lib/solana"
import { useTokenBalances } from "@/lib/solana"
import { formatCurrency } from "@/lib/utils"
import { getFeeBreakdown } from "@/lib/fees"
import { ArrowRight, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FeeBreakdown from "@/components/FeeBreakdown"
import AnimatedAlert from "@/components/AnimatedAlert"

interface ContributionPanelProps {
  pool: Pool
  onSuccess?: () => void
}

export default function ContributionPanel({ pool, onSuccess }: ContributionPanelProps) {
  const { publicKey } = useWallet()
  const { balances, isLoading: isLoadingBalances } = useTokenBalances()

  const [amount, setAmount] = useState<string>(pool.contributionAmount.toString())
  const [isContributing, setIsContributing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false)

  const tokenBalance = balances.find((token) => token.mint === pool.contributionToken)

  // Calculate fees
  const amountValue = Number.parseFloat(amount) || 0
  const walletAddress = publicKey?.toBase58() || undefined
  const feeBreakdown = getFeeBreakdown(amountValue, walletAddress, pool)

  const handleContribute = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (!walletAddress) {
      setError("Please connect your wallet to contribute")
      return
    }

    // Check if user has enough balance for amount + fees
    if (tokenBalance && feeBreakdown.totalAmount > tokenBalance.uiAmount) {
      setError(`Insufficient balance. You have ${tokenBalance.uiAmount} ${tokenBalance.symbol}`)
      return
    }

    setIsContributing(true)
    setError(null)
    setSuccess(null)

    try {
      // TODO: Integrate with Solana transaction logic here
      // await contributeToAjoPool(pool.id, walletAddress, Number.parseFloat(amount))
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate async

      setSuccess(`Successfully contributed ${amount} ${pool.contributionTokenSymbol} to the pool`)
      setAmount(pool.contributionAmount.toString()) // Reset to default amount

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError((err as Error).message || "Failed to make contribution")
    } finally {
      setIsContributing(false)
    }
  }

  return (
    <Card className="w-full border-border/50">
      <CardHeader>
        <CardTitle>Make a Contribution</CardTitle>
        <CardDescription>Contribute to the pool for this {pool.frequency} cycle</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-purple-50 p-4 dark:bg-purple-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Required Contribution</p>
              <p className="text-lg font-semibold text-purple-900 dark:text-purple-200">
                {formatCurrency(pool.contributionAmount, pool.contributionTokenSymbol)}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-800">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="amount">Contribution Amount</Label>
            {isLoadingBalances ? (
              <span className="text-xs text-muted-foreground">Loading balance...</span>
            ) : tokenBalance ? (
              <span className="text-xs text-muted-foreground">
                Balance: {tokenBalance.uiAmount} {tokenBalance.symbol}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">No {pool.contributionTokenSymbol} balance found</span>
            )}
          </div>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError(null)
              }}
              className="pr-16"
              step="0.01"
              min="0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-sm text-muted-foreground">{pool.contributionTokenSymbol}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setAmount(pool.contributionAmount.toString())}
            >
              Default
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => tokenBalance && setAmount(tokenBalance.uiAmount.toString())}
              disabled={!tokenBalance || tokenBalance.uiAmount === 0}
            >
              Max
            </Button>
          </div>
        </div>

        {/* Fee breakdown */}
        <div className="pt-2">
          <Button
            variant="link"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
          >
            {showFeeBreakdown ? "Hide fee details" : "Show fee details"}
          </Button>

          {showFeeBreakdown ? (
            <FeeBreakdown
              baseAmount={amountValue}
              platformFee={feeBreakdown.platformFee}
              latePenalty={feeBreakdown.latePenalty}
              totalAmount={feeBreakdown.totalAmount}
              tokenSymbol={pool.contributionTokenSymbol}
              isPremium={feeBreakdown.isPremium}
              premiumDiscount={feeBreakdown.premiumDiscount}
              className="mt-2"
            />
          ) : (
            <FeeBreakdown
              baseAmount={amountValue}
              platformFee={feeBreakdown.platformFee}
              latePenalty={feeBreakdown.latePenalty}
              totalAmount={feeBreakdown.totalAmount}
              tokenSymbol={pool.contributionTokenSymbol}
              isPremium={feeBreakdown.isPremium}
              premiumDiscount={feeBreakdown.premiumDiscount}
              compact
              className="mt-2"
            />
          )}
        </div>

        {error && <AnimatedAlert type="error" message={error} onDismiss={() => setError(null)} />}

        {success && <AnimatedAlert type="success" message={success} onDismiss={() => setSuccess(null)} />}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
          onClick={handleContribute}
          disabled={isContributing || !amount || Number.parseFloat(amount) <= 0}
        >
          {isContributing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Contribute
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
