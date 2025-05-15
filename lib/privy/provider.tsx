"use client"

import type React from "react"

import { PrivyProvider as PrivyClientProvider } from "@privy-io/react-auth"
import { useRouter } from "next/navigation"
import { syncUserWithSupabase } from "@/lib/privy/hooks";

interface PrivyProviderProps {
  children: React.ReactNode
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const router = useRouter()

  const handleLogin = async (user: any) => {
    try {
      // Sync the Privy user with Supabase
      await syncUserWithSupabase(user)

      // Redirect to dashboard after successful login
      router.push("/dashboard")
    } catch (error) {
      console.error("Error syncing user with Supabase:", error)
    }
  }

  return (
    <PrivyClientProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["email", "wallet", "google", "apple"],
        appearance: {
          theme: "light",
          accentColor: "#8b5cf6", // Purple color to match our theme
          logo: "/logo.svg",
        },
        embeddedWallets: {
          createOnLogin: "all-users",
          noPromptOnSignature: false,
        },
        supportedChains: [
          {
            id: "solana:mainnet",
            name: "Solana",
            rpcUrl: "https://api.mainnet-beta.solana.com",
          },
          {
            id: "solana:devnet",
            name: "Solana Devnet",
            rpcUrl: "https://api.devnet.solana.com",
          },
        ],
      }}
      onSuccess={handleLogin}
    >
      {children}
    </PrivyClientProvider>
  )
}
