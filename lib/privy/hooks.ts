"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useEffect, useState, useRef } from "react"
import { syncUserWithSupabase, getCurrentUser } from "@/lib/privy/hooks"
import type { Tables } from "../supabase/schema"
import { supabase } from "../supabase/client"

export function usePrivyWithSupabase() {
  const { user: privyUser, authenticated, loading: privyLoading, ready } = usePrivy()
  const [supabaseUser, setSupabaseUser] = useState<Tables<"users"> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const subscriptionRef = useRef<any>(null)

  // Sync and fetch user from Privy to Supabase
  useEffect(() => {
    async function syncAndFetchUser() {
      if (authenticated && privyUser && ready) {
        setLoading(true)
        setError(null) // Reset error state
        try {
          // Sync the user data from Privy to Supabase
          await syncUserWithSupabase(privyUser)

          // Fetch the latest user data from Supabase
          const user = await getCurrentUser(privyUser.id)
          setSupabaseUser(user)
        } catch (error) {
          console.error("Error syncing/fetching Supabase user:", error)
          setError("Failed to sync user data.")
        } finally {
          setLoading(false)
        }
      } else if (!privyLoading && ready) {
        setLoading(false)
      }
    }

    syncAndFetchUser()
  }, [authenticated, privyUser, privyLoading, ready])

  // Set up real-time subscription for user data changes
  useEffect(() => {
    if (!privyUser?.id) return

    // Unsubscribe from previous subscription if it exists
    subscriptionRef.current?.unsubscribe()

    // Create a new subscription for the user
    subscriptionRef.current = supabase
      .channel(`user-${privyUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users", filter: `privy_id=eq.${privyUser.id}` },
        async () => {
          const user = await getCurrentUser(privyUser.id)
          setSupabaseUser(user)
        },
      )
      .subscribe()

    // Cleanup subscription on component unmount or privyUser change
    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [privyUser?.id])

  return {
    privyUser,
    supabaseUser,
    loading: loading || privyLoading || !ready,
    authenticated,
    error,
  }
}
