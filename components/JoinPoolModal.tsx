"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePrivyWithSupabase } from "@/lib/privy/hooks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface JoinPoolModalProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export default function JoinPoolModal({ trigger, open, onOpenChange, onSuccess }: JoinPoolModalProps) {
  const router = useRouter()
  const { privyUser, supabaseUser } = usePrivyWithSupabase()
  const [poolId, setPoolId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolDetails, setPoolDetails] = useState<any | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!poolId.trim()) {
      setError("Please enter a pool ID")
      return
    }

    setIsSearching(true)
    setError(null)
    setPoolDetails(null)

    try {
      // Search for the pool
      const { data, error } = await supabase
        .from("pools")
        .select(`
          id, 
          name, 
          description, 
          contribution_amount, 
          contribution_token_symbol,
          frequency,
          total_members,
          current_members,
          creator:creator_id(display_name, wallet_address)
        `)
        .eq("id", poolId.trim())
        .single()

      if (error || !data) {
        setError("Pool not found. Please check the ID and try again.")
        setPoolDetails(null)
      } else {
        // Check if the user is already a member
        const { data: membership } = await supabase
          .from("pool_members")
          .select("id")
          .eq("pool_id", data.id)
          .eq("user_id", supabaseUser?.id)
          .maybeSingle()

        if (membership) {
          setError("You are already a member of this pool.")
          setPoolDetails(null)
        } else if (data.current_members >= data.total_members) {
          setError("This pool is already full.")
          setPoolDetails(null)
        } else {
          setPoolDetails(data)
          setError(null)
        }
      }
    } catch (err) {
      console.error("Error searching for pool:", err)
      setError("An error occurred while searching for the pool.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleJoin = async () => {
    if (!poolDetails || !supabaseUser) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/pools/${poolId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to join pool")
      }

      // Success
      if (onOpenChange) onOpenChange(false)
      if (onSuccess) onSuccess()

      // Navigate to the pool page
      router.push(`/pool/${poolId}/${poolDetails.name.toLowerCase().replace(/\s+/g, "-")}`)
    } catch (err: any) {
      console.error("Error joining pool:", err)
      setError(err.message || "An error occurred while joining the pool.")
    } finally {
      setIsLoading(false)
    }
  }

  const modalContent = (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Join a Pool</DialogTitle>
        <DialogDescription>Enter the ID of the pool you want to join.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="pool-id">Pool ID</Label>
          <div className="flex items-center gap-2">
            <Input
              id="pool-id"
              placeholder="Enter pool ID"
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
              disabled={isLoading || isSearching}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSearch}
              disabled={isLoading || isSearching || !poolId.trim()}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {poolDetails && (
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">{poolDetails.name}</h3>
            <p className="text-sm text-muted-foreground">{poolDetails.description}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Contribution:</span>{" "}
                <span className="font-medium">
                  {poolDetails.contribution_amount} {poolDetails.contribution_token_symbol}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Frequency:</span>{" "}
                <span className="font-medium">{poolDetails.frequency}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Members:</span>{" "}
                <span className="font-medium">
                  {poolDetails.current_members}/{poolDetails.total_members}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Creator:</span>{" "}
                <span className="font-medium">{poolDetails.creator?.display_name || "Unknown"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="flex items-center justify-between sm:justify-between">
        <Button variant="outline" onClick={() => onOpenChange?.(false)} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleJoin} disabled={isLoading || !poolDetails} className="bg-purple-600 hover:bg-purple-700">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Join Pool
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {modalContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {modalContent}
    </Dialog>
  )
}
