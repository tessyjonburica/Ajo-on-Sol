"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePrivyWithSupabase } from "@/lib/privy/hooks"
import { Loader2 } from "lucide-react"

interface AuthGateProps {
  children: React.ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const { privyUser, supabaseUser, loading, authenticated } = usePrivyWithSupabase()
  const router = useRouter()

  useEffect(() => {
    // If not loading and not authenticated, redirect to home
    if (!loading && !authenticated) {
      router.push("/")
    }
  }, [loading, authenticated, router])

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="mt-4 text-lg font-medium">Loading...</p>
      </div>
    )
  }

  // If not authenticated, don't render children
  if (!authenticated || !privyUser) {
    return null
  }

  // If authenticated but no Supabase user yet, show syncing state
  if (!supabaseUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="mt-4 text-lg font-medium">Syncing your account...</p>
      </div>
    )
  }

  // If authenticated and has Supabase user, render children
  return <>{children}</>
}
