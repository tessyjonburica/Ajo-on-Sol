"use client"

import { createContext, useContext, useEffect, useState, useMemo } from "react"
import { usePrivy as usePrivyAuth, useWallets, useLogin } from "@privy-io/react-auth"

// Types
export type User = {
  id: string
  wallet: {
    address: string
    publicKey: string
  }
  email?: string
  name?: string
  avatar?: string
}

export type PrivyContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  getWalletAddress: () => string | null
}

const PrivyContext = createContext<PrivyContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  getWalletAddress: () => null,
})

export const usePrivy = () => {
  const context = useContext(PrivyContext)
  if (!context) {
    throw new Error("usePrivy must be used within a PrivyProvider")
  }
  return context
}

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  // Initialize all hooks first
  const [isMounted, setIsMounted] = useState(false)
  const { ready, authenticated, login, logout } = usePrivyAuth()
  const { wallets } = useWallets()

  // Memoize derived state
  const mainWallet = useMemo(() => wallets[0], [wallets])
  const isLoading = !ready
  const isAuthenticated = authenticated && !!mainWallet

  const user = useMemo(() => 
    mainWallet ? {
      id: mainWallet.address,
      wallet: {
        address: mainWallet.address,
        publicKey: mainWallet.address,
      }
    } : null,
    [mainWallet]
  )

  const getWalletAddress = useMemo(() => 
    () => mainWallet?.address || null,
    [mainWallet]
  )

  // Handle mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debug logging
  useEffect(() => {
    if (isMounted) {
      console.log('Privy Provider State:', {
        ready,
        authenticated,
        isLoading,
        isAuthenticated,
        mainWallet: mainWallet?.address,
        walletsCount: wallets.length,
        isBrowser: typeof window !== 'undefined'
      })
    }
  }, [isMounted, ready, authenticated, isLoading, isAuthenticated, mainWallet, wallets])

  // Don't render until mounted
  if (!isMounted) {
    return null
  }

  return (
    <PrivyContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        getWalletAddress,
      }}
    >
      {children}
    </PrivyContext.Provider>
  )
}
