"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from "@solana/web3.js"
import { useAjoContract } from "@/lib/solana/hooks"
import type { Pool } from "@/lib/solana"
import { formatCurrency } from "@/lib/utils"
import { AlertTriangle, Check, Loader2, LogOut, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface WithdrawButtonProps {
  pool: Pool
  onSuccess?: () => void
}

export default function WithdrawButton({ pool, onSuccess }: WithdrawButtonProps) {
  const { publicKey } = useWallet()
  const { emergencyWithdraw } = useAjoContract()

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<string>("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleWithdraw = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    const walletAddress = publicKey?.toBase58() || undefined
    if (!walletAddress) {
      setError("Please connect your wallet to withdraw")
      return
    }

    setIsWithdrawing(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if we have the Solana pool address
      if (pool.solana_address) {
        // Use the Solana smart contract for withdrawal
        await emergencyWithdraw(
          pool.solana_address,
          walletAddress,
          Number.parseFloat(amount)
        )
      } else {
        // Fallback to API call if no Solana address
        throw new Error("This pool is not linked to a smart contract yet")
      }

      setSuccess(`Successfully withdrew ${amount} ${pool.contributionTokenSymbol} from the pool`)
      setAmount("")

      if (onSuccess) {
        onSuccess()
      }

      // Close dialog after success
      setTimeout(() => {
        setOpen(false)
      }, 2000)
    } catch (err) {
      setError((err as Error).message || "Failed to withdraw")
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Emergency Withdraw
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Emergency Withdrawal</DialogTitle>
          <DialogDescription>
            This will create a proposal for emergency withdrawal. If approved by other members, you will be able to
            withdraw funds.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Alert className="bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Emergency withdrawals may be subject to penalties as per pool rules. This action requires approval from
              other members.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="withdrawAmount">Withdrawal Amount</Label>
            <div className="relative">
              <Input
                id="withdrawAmount"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError(null)
                }}
                className="pr-16"
                step="0.01"
                min="0"
                placeholder={`Max: ${pool.totalContributed}`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-sm text-muted-foreground">{pool.contributionTokenSymbol}</span>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-purple-50 p-3 dark:bg-purple-900/20">
            <p className="text-sm text-purple-800 dark:text-purple-300">
              Total contributed: {formatCurrency(pool.totalContributed, pool.contributionTokenSymbol)}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={isWithdrawing || !amount || Number.parseFloat(amount) <= 0}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Request Withdrawal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
