"use client"

import { useState } from "react"
import { Crown, Sparkles, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MotionModal } from "./MotionWrapper"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AnimatePresence, motion } from "framer-motion"
import {
  USER_PREMIUM_MONTHLY_PRICE,
  POOL_PREMIUM_MONTHLY_PRICE,
  upgradeUserToPremium,
  upgradePoolToPremium,
} from "@/lib/subscription"
import { getUpgradeableFeatures, FEATURE_DESCRIPTIONS } from "@/lib/premium"

interface PremiumUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  userAddress?: string
  poolId?: string
  onSuccess?: () => void
  defaultTab?: "user" | "pool"
}

/**
 * A modal component for upgrading to premium user or premium pool
 */
export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  userAddress,
  poolId,
  onSuccess,
  defaultTab = "user",
}: PremiumUpgradeModalProps) {
  const [activeTab, setActiveTab] = useState<"user" | "pool">(poolId ? defaultTab : "user")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Get features that would become available with upgrade
  const userUpgradeFeatures = getUpgradeableFeatures("user", userAddress, poolId)
  const poolUpgradeFeatures = poolId ? getUpgradeableFeatures("pool", userAddress, poolId) : []

  const handleUpgrade = async () => {
    if (!userAddress) {
      setError("Please connect your wallet to upgrade")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let success = false

      if (activeTab === "user") {
        success = await upgradeUserToPremium(userAddress)
      } else if (activeTab === "pool" && poolId) {
        success = await upgradePoolToPremium(poolId, userAddress)
      }

      if (success) {
        setSuccess(`Successfully upgraded to ${activeTab === "user" ? "Premium User" : "Premium Pool"}!`)

        // Auto-close after success
        setTimeout(() => {
          if (onSuccess) onSuccess()
          onClose()
        }, 2000)
      } else {
        setError("Upgrade failed. Please try again.")
      }
    } catch (err) {
      setError((err as Error).message || "An error occurred during the upgrade process")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <MotionModal>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Upgrade to Premium</DialogTitle>
            <DialogDescription className="text-center">
              Unlock advanced features and benefits with premium
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "user" | "pool")}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span>Premium User</span>
              </TabsTrigger>
              <TabsTrigger value="pool" className="flex items-center gap-2" disabled={!poolId}>
                <Sparkles className="h-4 w-4" />
                <span>Premium Pool</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="mt-4 space-y-4">
              <div className="rounded-md bg-purple-50 p-4 dark:bg-purple-900/20">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium text-purple-900 dark:text-purple-300">Premium User Benefits</h3>
                  <div className="rounded-full bg-purple-100 px-2 py-1 text-sm font-medium text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                    ₦{USER_PREMIUM_MONTHLY_PRICE}/month
                  </div>
                </div>
                <ul className="space-y-2">
                  {userUpgradeFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-purple-800 dark:text-purple-300">
                      <Check className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                      <span>{FEATURE_DESCRIPTIONS[feature]}</span>
                    </li>
                  ))}
                  {userUpgradeFeatures.length === 0 && (
                    <li className="text-sm text-purple-800 dark:text-purple-300">
                      You already have access to all premium user features!
                    </li>
                  )}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="pool" className="mt-4 space-y-4">
              <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium text-amber-900 dark:text-amber-300">Premium Pool Benefits</h3>
                  <div className="rounded-full bg-amber-100 px-2 py-1 text-sm font-medium text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                    ₦{POOL_PREMIUM_MONTHLY_PRICE}/month
                  </div>
                </div>
                <ul className="space-y-2">
                  {poolUpgradeFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                      <Check className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>{FEATURE_DESCRIPTIONS[feature]}</span>
                    </li>
                  ))}
                  {poolUpgradeFeatures.length === 0 && (
                    <li className="text-sm text-amber-800 dark:text-amber-300">
                      This pool already has access to all premium pool features!
                    </li>
                  )}
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
              >
                <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={
                isLoading ||
                (activeTab === "user" && userUpgradeFeatures.length === 0) ||
                (activeTab === "pool" && poolUpgradeFeatures.length === 0)
              }
              className={activeTab === "user" ? "bg-purple-600 hover:bg-purple-700" : "bg-amber-600 hover:bg-amber-700"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Upgrade {activeTab === "user" ? "User" : "Pool"}</>
              )}
            </Button>
          </DialogFooter>
        </MotionModal>
      </DialogContent>
    </Dialog>
  )
}
