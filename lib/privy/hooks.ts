"use client"

import { usePrivy } from "@privy-io/react-auth"
import { useEffect, useState } from "react"
import { getCurrentUser } from "./actions"
import type { Tables } from "../supabase/schema"

export function usePrivyWithSupabase() {
  const { user: privyUser, authenticated, loading: privyLoading } = usePrivy()
  const [supabaseUser, setSupabaseUser] = useState<Tables<"users"> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSupabaseUser() {
      if (authenticated && privyUser) {
        try {
          const user = await getCurrentUser(privyUser.id)
          setSupabaseUser(user)
        } catch (error) {
          console.error("Error fetching Supabase user:", error)
        } finally {
          setLoading(false)
        }
      } else if (!privyLoading) {
        setLoading(false)
      }
    }

    fetchSupabaseUser()
  }, [authenticated, privyUser, privyLoading])

  return {
    privyUser,
    supabaseUser,
    loading: loading || privyLoading,
    authenticated,
  }
}
