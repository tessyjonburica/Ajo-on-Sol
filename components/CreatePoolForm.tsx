"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useWallet } from '@solana/wallet-adapter-react'
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
]

export default function CreatePoolForm() {
  const router = useRouter()
  const { publicKey, connected } = useWallet()
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [openTokenSelect, setOpenTokenSelect] = useState(false)

  // Generate a slug from the pool name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field when user selects
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleTokenSelect = (mint: string, symbol: string) => {
    setFormData((prev) => ({
      ...prev,
      contributionToken: mint,
      contributionTokenSymbol: symbol,
    }))
    setOpenTokenSelect(false)

    // Clear error for this field when user selects
    if (errors.contributionToken) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.contributionToken
        return newErrors
      })
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, yieldEnabled: checked }))
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = "Pool name is required"
      } else if (formData.name.length < 3) {
        newErrors.name = "Pool name must be at least 3 characters"
      }

      if (!formData.description.trim()) {
        newErrors.description = "Description is required"
      }
    } else if (step === 2) {
      if (!formData.contributionAmount) {
        newErrors.contributionAmount = "Contribution amount is required"
      } else if (Number(formData.contributionAmount) <= 0) {
        newErrors.contributionAmount = "Contribution amount must be greater than 0"
      }

      if (!formData.contributionToken) {
        newErrors.contributionToken = "Please select a token"
      }

      if (!formData.totalMembers) {
        newErrors.totalMembers = "Total members is required"
      } else if (Number(formData.totalMembers) < 2) {
        newErrors.totalMembers = "Pool must have at least 2 members"
      } else if (Number(formData.totalMembers) > 100) {
        newErrors.totalMembers = "Pool cannot have more than 100 members"
      }
    } else if (step === 3) {
      if (!formData.startDate) {
        newErrors.startDate = "Start date is required"
      }

      if (!formData.endDate) {
        newErrors.endDate = "End date is required"
      } else if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = "End date must be after start date"
      }

      // Validate that start date is not in the past
      if (formData.startDate && new Date(formData.startDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
        newErrors.startDate = "Start date cannot be in the past"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    setStep((prev) => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep()) {
      return
    }

    // If not showing confirmation yet, show it first
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Convert string values to appropriate types
      const poolData = {
        ...formData,
        creator: publicKey ? publicKey.toBase58() : "",
        members: [publicKey ? publicKey.toBase58() : ""],
        wallet_address: publicKey ? publicKey.toBase58() : "",
        contributionAmount: Number.parseFloat(formData.contributionAmount),
        totalMembers: Number.parseInt(formData.totalMembers),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        slug: generateSlug(formData.name),
      }

      const newPool = await createPool(poolData)

      // Redirect to dashboard after successful creation
      router.push(`/pool/${newPool.id}/${generateSlug(formData.name)}`)
    } catch (error) {
      console.error("Error creating pool:", error)
      setErrorMessage((error as Error).message || "Failed to create pool. Please try again.")
      setShowConfirmation(false)
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
                  className={cn("w-full", errors.name && "border-red-500")}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the purpose of this savings pool"
                  value={formData.description}
                  onChange={handleChange}
                  className={cn("min-h-[100px] w-full", errors.description && "border-red-500")}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
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
                      className={cn("pl-9", errors.contributionAmount && "border-red-500")}
                    />
                  </div>
                  {errors.contributionAmount && <p className="text-xs text-red-500">{errors.contributionAmount}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contributionToken">Token</Label>
                  <Popover open={openTokenSelect} onOpenChange={setOpenTokenSelect}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openTokenSelect}
                        className={cn("w-full justify-between", errors.contributionToken && "border-red-500")}
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
                  {errors.contributionToken && <p className="text-xs text-red-500">{errors.contributionToken}</p>}
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
                      className={cn("pl-9", errors.totalMembers && "border-red-500")}
                    />
                  </div>
                  {errors.totalMembers && <p className="text-xs text-red-500">{errors.totalMembers}</p>}
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
                      className={cn("pl-9", errors.startDate && "border-red-500")}
                    />
                  </div>
                  {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
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
                      className={cn("pl-9", errors.endDate && "border-red-500")}
                    />
                  </div>
                  {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
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

              {showConfirmation && (
                <Alert className="bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  <AlertTitle>Confirm Pool Creation</AlertTitle>
                  <AlertDescription>
                    Are you sure you want to create this pool? This action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
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
            <Button
              type="button"
              variant="outline"
              onClick={step === 4 && showConfirmation ? () => setShowConfirmation(false) : prevStep}
              disabled={isSubmitting}
            >
              {step === 4 && showConfirmation ? "Cancel" : "Back"}
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
              ) : showConfirmation ? (
                "Confirm & Create"
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
