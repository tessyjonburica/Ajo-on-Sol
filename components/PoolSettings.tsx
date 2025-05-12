"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { isPoolCreator, canEditPool } from "@/lib/roles"
import { isPremiumPool } from "@/lib/subscription"
import { isFeatureAvailable } from "@/lib/premium"
import type { Pool } from "@/lib/solana"
import { Calendar, Check, Loader2, Save, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import LockedFeatureBanner from "@/components/LockedFeatureBanner"
import PremiumBadge from "@/components/PremiumBadge"
import { useWallet } from '@solana/wallet-adapter-react'

interface PoolSettingsProps {
  pool: Pool
  onSuccess?: () => void
  onOpenPremiumModal: () => void
}

export default function PoolSettings({ pool, onSuccess, onOpenPremiumModal }: PoolSettingsProps) {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58() || undefined
  const [activeTab, setActiveTab] = useState("general")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check permissions
  const isCreator = isPoolCreator(walletAddress, pool)
  const canEdit = canEditPool(walletAddress, pool)
  const isPremium = isPremiumPool(pool.id)

  // Check premium features
  const canUseCustomSchedule = isFeatureAvailable("custom_schedule", walletAddress, pool.id)
  const canUseLargePool = isFeatureAvailable("large_pool", walletAddress, pool.id)
  const canUseYieldFarming = isFeatureAvailable("yield_farming", walletAddress, pool.id)

  const [formData, setFormData] = useState({
    name: pool.name,
    description: pool.description,
    contributionAmount: pool.contributionAmount.toString(),
    contributionToken: pool.contributionToken,
    frequency: pool.frequency,
    totalMembers: pool.totalMembers.toString(),
    startDate: new Date(pool.startDate).toISOString().split("T")[0],
    endDate: new Date(pool.endDate).toISOString().split("T")[0],
    yieldEnabled: pool.yieldEnabled,
  })

  // Auto-dismiss success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }

    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess("Pool settings updated successfully")

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError((err as Error).message || "Failed to update pool settings")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isCreator) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Access Denied</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Only the pool creator can access pool settings.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pool Settings</CardTitle>
            <CardDescription>Manage your pool settings and configuration</CardDescription>
          </div>
          {isPremium && <PremiumBadge type="pool" size="sm" />}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6">
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pool Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={!canEdit} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={!canEdit}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contributionAmount">Contribution Amount</Label>
                  <Input
                    id="contributionAmount"
                    name="contributionAmount"
                    type="number"
                    value={formData.contributionAmount}
                    onChange={handleChange}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => handleSelectChange("frequency", value)}
                    disabled={!canEdit || !canUseCustomSchedule}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!canUseCustomSchedule && (
                <LockedFeatureBanner
                  title="Custom Schedule"
                  description="Upgrade to Premium Pool to customize contribution frequency"
                  featureType="pool"
                  feature="custom_schedule"
                  onUpgrade={onOpenPremiumModal}
                  compact
                />
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totalMembers">Total Members</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="totalMembers"
                    name="totalMembers"
                    type="number"
                    value={formData.totalMembers}
                    onChange={handleChange}
                    disabled={!canEdit || (!canUseLargePool && Number.parseInt(formData.totalMembers) > 20)}
                    className="flex-1"
                  />
                  <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Current: {pool.currentMembers}</span>
                  </div>
                </div>
              </div>

              {!canUseLargePool && Number.parseInt(formData.totalMembers) > 20 && (
                <LockedFeatureBanner
                  title="Large Pool"
                  description="Upgrade to Premium Pool to create pools with more than 20 members"
                  featureType="pool"
                  feature="large_pool"
                  onUpgrade={onOpenPremiumModal}
                  compact
                />
              )}

              <div className="rounded-md border border-border p-4">
                <h3 className="mb-3 text-sm font-medium">Member Management</h3>
                <p className="text-sm text-muted-foreground">
                  You can't remove members once they've joined the pool. You can only adjust the total number of members
                  if no one has joined yet.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="pl-9"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="pl-9"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="yieldEnabled">Enable Yield Farming</Label>
                    <p className="text-sm text-muted-foreground">
                      Earn additional yield on pool funds through DeFi integrations
                    </p>
                  </div>
                  <Switch
                    id="yieldEnabled"
                    checked={formData.yieldEnabled}
                    onCheckedChange={(checked) => handleSwitchChange("yieldEnabled", checked)}
                    disabled={!canUseYieldFarming}
                  />
                </div>
              </div>

              {!canUseYieldFarming && (
                <LockedFeatureBanner
                  title="Yield Farming"
                  description="Upgrade to Premium Pool to enable yield farming and earn additional returns"
                  featureType="pool"
                  feature="yield_farming"
                  onUpgrade={onOpenPremiumModal}
                  compact
                />
              )}

              <Separator className="my-4" />

              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <h3 className="mb-2 text-sm font-medium text-destructive">Danger Zone</h3>
                <p className="mb-4 text-sm text-muted-foreground">These actions cannot be undone. Please be certain.</p>
                <Button variant="destructive" type="button" disabled={!canEdit || pool.currentMembers > 1}>
                  Delete Pool
                </Button>
              </div>
            </TabsContent>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6"
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
                  className="mt-6"
                >
                  <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                className="gap-2 bg-purple-600 hover:bg-purple-700"
                disabled={isSubmitting || !canEdit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  )
}
