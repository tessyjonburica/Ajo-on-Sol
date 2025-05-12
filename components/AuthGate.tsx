"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from '@solana/wallet-adapter-react'
import { Loader2 } from 'lucide-react'

interface AuthGateProps {
  children: React.ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const { publicKey, connected, connecting } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (!connecting && !connected) {
      router.push("/")
    }
  }, [connecting, connected, router])

  if (connecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="mt-4 text-lg font-medium">Connecting wallet...</p>
      </div>
    )
  }

  if (!connected || !publicKey) {
    return null
  }

  return <>{children}</>
}
