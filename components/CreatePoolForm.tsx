"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { usePrivy } from "@/lib/privy"
import { createPool } from "@/lib/api"
import { useTokenBalances } from "@/lib/solana"
import { ArrowRight, Calendar, Check, ChevronsUpDown, DollarSign, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
]

export default function CreatePoolForm() {
  const router = useRouter()
  const { user } = usePrivy()
  const { balances, isLoading: isLoadingTokens } = useTokenBalances()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "",
    contributionToken: "",
    contributionTokenSymbol: "",
    frequency: "weekly",
    totalMembers: "",
    startDate: "",
    endDate: "",
    yieldEnabled: false,
  })

  const [openTokenSelect, setOpenTokenSelect] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTokenSelect = (mint: string, symbol: string) => {
    setFormData((prev) => ({
      ...prev,
      contributionToken: mint,
      contributionTokenSymbol: symbol,
    }))
    setOpenTokenSelect(false)
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, yieldEnabled: checked }))
  }

  const nextStep = () => {
    setStep((prev) => prev + 1)
  }

  const prevStep = () => {
    setStep((prev) => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convert string values to appropriate types
      const poolData = {
        ...formData,
        creator: user?.wallet.address || "",
        members: [user?.wallet.address || ""],
        contributionAmount: Number.parseFloat(formData.contributionAmount),
        totalMembers: Number.parseInt(formData.totalMembers),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      }

      await createPool(poolData)

      // Redirect to dashboard after successful creation
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating pool:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    if (step === 1) {
      return formData.name && formData.description
    } else if (step === 2) {
      return formData.contributionAmount && formData.contributionToken && formData.frequency && formData.totalMembers
    } else if (step === 3) {
      return formData.startDate && formData.endDate
    }
    return true
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CardHeader>
              <CardTitle>Pool Details</CardTitle>
              <CardDescription>Give your savings pool a name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pool Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Lagos Traders Group"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the purpose of this savings pool"
                  value={formData.description}
                  onChange={handleChange}
                  className="min-h-[100px] w-full"
                />
              </div>
            </CardContent>
          </motion.div>
        )
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CardHeader>
              <CardTitle>Contribution Settings</CardTitle>
              <CardDescription>Set the contribution amount, token, and frequency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contributionAmount">Contribution Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contributionAmount"
                      name="contributionAmount"
                      type="number"
                      placeholder="50"
                      value={formData.contributionAmount}
                      onChange={handleChange}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contributionToken">Token</Label>
                  <Popover open={openTokenSelect} onOpenChange={setOpenTokenSelect}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openTokenSelect}
                        className="w-full justify-between"
                      >
                        {formData.contributionTokenSymbol || "Select token"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search token..." />
                        <CommandList>
                          <CommandEmpty>No token found.</CommandEmpty>
                          <CommandGroup>
                            {isLoadingTokens ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              balances.map((token) => (
                                <CommandItem
                                  key={token.mint}
                                  value={token.symbol}
                                  onSelect={() => handleTokenSelect(token.mint, token.symbol)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.contributionToken === token.mint ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  <div className="flex items-center gap-2">
                                    {token.logo && (
                                      <img
                                        src={token.logo || "/placeholder.svg"}
                                        alt={token.symbol}
                                        className="h-5 w-5 rounded-full"
                                      />
                                    )}
                                    <span>{token.symbol}</span>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value) => handleSelectChange("frequency", value)}>
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((frequency) => (
                        <SelectItem key={frequency.value} value={frequency.value}>
                          {frequency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalMembers">Total Members</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="totalMembers"
                      name="totalMembers"
                      type="number"
                      placeholder="10"
                      value={formData.totalMembers}
                      onChange={handleChange}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CardHeader>
              <CardTitle>Schedule & Options</CardTitle>
              <CardDescription>Set the start and end dates for your savings pool</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Switch id="yieldEnabled" checked={formData.yieldEnabled} onCheckedChange={handleSwitchChange} />
                </div>
              </div>
            </CardContent>
          </motion.div>
        )
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>Review your pool details before creating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-1">
                    <p className="text-sm font-medium">Pool Name:</p>
                    <p className="text-sm">{formData.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <p className="text-sm font-medium">Description:</p>
                    <p className="text-sm">{formData.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <p className="text-sm font-medium">Contribution:</p>
                    <p className="text-sm">
                      {formData.contributionAmount} {formData.contributionTokenSymbol}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <p className="text-sm font-medium">Frequency:</p>
                    <p className="text-sm capitalize">{formData.frequency}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <p className="text-sm font-medium">Members:</p>
                    <p className="text-sm">{formData.totalMembers}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <p className="text-sm font-medium">Start Date:</p>
                    <p className="text-sm">{formData.startDate}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <p className="text-sm font-medium">End Date:</p>
                    <p className="text-sm">{formData.endDate}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <p className="text-sm font-medium">Yield Farming:</p>
                    <p className="text-sm">{formData.yieldEnabled ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-2xl border-border/50">
      <form onSubmit={handleSubmit}>
        {renderStep()}
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
              Back
            </Button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Pool"
              )}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
