"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { usePrivy } from "@/lib/privy"
import { joinPool } from "@/lib/api"
import type { Pool } from "@/lib/solana"
import { Check, Copy, Loader2, QrCode, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { copyToClipboard } from "@/lib/utils"

interface JoinPoolModalProps {
  pool?: Pool
  trigger?: React.ReactNode
  defaultOpen?: boolean
  onSuccess?: () => void
}

export default function JoinPoolModal({ pool, trigger, defaultOpen = false, onSuccess }: JoinPoolModalProps) {
  const router = useRouter()
  const { user } = usePrivy()

  const [open, setOpen] = useState(defaultOpen)
  const [isJoining, setIsJoining] = useState(false)
  const [poolId, setPoolId] = useState(pool?.id || "")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    if (!poolId) {
      setError("Please enter a pool ID")
      return
    }

    if (!user?.wallet.address) {
      setError("Please connect your wallet first")
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      await joinPool(poolId, user.wallet.address)

      // Close modal and redirect or callback
      setOpen(false)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/pool/${poolId}`)
      }
    } catch (err) {
      setError((err as Error).message || "Failed to join pool")
    } finally {
      setIsJoining(false)
    }
  }

  const handleCopy = async () => {
    if (pool) {
      const url = `${window.location.origin}/join/${pool.id}`
      const success = await copyToClipboard(url)

      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const shareLink = () => {
    if (pool && navigator.share) {
      navigator.share({
        title: `Join ${pool.name} on Ajo for Sol`,
        text: `I'm inviting you to join my savings pool "${pool.name}" on Ajo for Sol.`,
        url: `${window.location.origin}/join/${pool.id}`,
      })
    } else {
      handleCopy()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Savings Pool</DialogTitle>
          <DialogDescription>Enter a pool ID, invite code, or scan a QR code to join</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="code" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">Invite Code</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="poolId">Pool ID or Invite Code</Label>
              <Input
                id="poolId"
                value={poolId}
                onChange={(e) => {
                  setPoolId(e.target.value)
                  setError(null)
                }}
                placeholder="Enter pool ID or invite code"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300"
              >
                {error}
              </motion.div>
            )}

            {pool && (
              <div className="rounded-md bg-purple-50 p-3 dark:bg-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Share this pool</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {window.location.origin}/join/{pool.id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopy}>
                      <AnimatePresence mode="wait">
                        {copied ? (
                          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="h-4 w-4 text-green-600" />
                          </motion.div>
                        ) : (
                          <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Copy className="h-4 w-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={shareLink}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="qr" className="mt-4 flex flex-col items-center justify-center space-y-4">
            <div className="rounded-lg border border-border p-4">
              <div className="flex h-48 w-48 items-center justify-center bg-white">
                <QrCode className="h-32 w-32 text-purple-900" />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Scan this QR code with your camera to join the pool
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={isJoining || !poolId} className="bg-purple-600 hover:bg-purple-700">
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Pool"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
