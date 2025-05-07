"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useEffect, useState } from "react"
import { syncUserWithSupabase, getCurrentUser } from "@lib/privy/hooks"
import type { Tables } from "../supabase/schema"
import { supabase } from "../supabase/client"

export function usePrivyWithSupabase() {
  const { user: privyUser, authenticated, loading: privyLoading, ready } = usePrivy()
  const [supabaseUser, setSupabaseUser] = useState<Tables<"users"> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function syncAndFetchUser() {
      if (authenticated && privyUser && ready) {
        try {
          // First sync the user data from Privy to Supabase
          await syncUserWithSupabase(privyUser)

          // Then fetch the latest user data from Supabase
          const user = await getCurrentUser(privyUser.id)
          setSupabaseUser(user)
        } catch (error) {
          console.error("Error syncing/fetching Supabase user:", error)
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

    const userSubscription = supabase
      .channel(`user-${privyUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users", filter: `privy_id=eq.${privyUser.id}` },
        async (payload) => {
          // Update the user data when it changes
          const user = await getCurrentUser(privyUser.id)
          setSupabaseUser(user)
        },
      )
      .subscribe()

    return () => {
      userSubscription.unsubscribe()
    }
  }, [privyUser?.id])

  return {
    privyUser,
    supabaseUser,
    loading: loading || privyLoading || !ready,
    authenticated,
  }
}
