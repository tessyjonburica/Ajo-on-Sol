"use client"

import dynamic from 'next/dynamic'
import { useEffect, useState, useMemo } from 'react'
import { ThemeProvider } from "@/components/theme-provider"

// Dynamically import Privy components with no SSR
const PrivyClientProvider = dynamic(
  () => import("@privy-io/react-auth").then(mod => mod.PrivyProvider),
  { ssr: false }
)

const CustomPrivyProvider = dynamic(
  () => import("@/lib/privy").then(mod => mod.PrivyProvider),
  { ssr: false }
)

export function Providers({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  // Get the current origin for WalletConnect metadata
  const origin = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }, [])

  useEffect(() => {
    setIsMounted(true)
    // Debug logging
    console.log('Component mounted, checking window:', typeof window !== 'undefined' ? 'Browser' : 'Server')
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <PrivyClientProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        config={{
          walletConnectors: ["solana"],
          appearance: {
            theme: "light",
            accentColor: "#7C3AED",
            showWalletBanner: false,
          },
          defaultChain: "solana",
          supportedChains: ["solana"],
          metadata: {
            name: "Ajo on Sol",
            description: "Community Savings on Solana",
            url: origin,
            icons: [`${origin}/logo.png`]
          }
        }}
      >
        <CustomPrivyProvider>
          {children}
        </CustomPrivyProvider>
      </PrivyClientProvider>
    </ThemeProvider>
  )
} 