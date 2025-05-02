"use client"

import type React from "react"

// Mock Privy authentication helpers
import { createContext, useContext, useState, useEffect } from "react"

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

// Create context
export const PrivyContext = createContext<PrivyContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  getWalletAddress: () => null,
})

// Mock user data
const MOCK_USER: User = {
  id: "user_123456789",
  wallet: {
    address: "GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL",
    publicKey: "GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL",
  },
  name: "Demo User",
  avatar: "/placeholder.svg?height=40&width=40",
}

// Hook to use Privy context
export const usePrivy = () => useContext(PrivyContext)

// Provider component
export const PrivyProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      // Check if user is stored in localStorage
      const storedUser = localStorage.getItem("ajo_user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const login = async () => {
    setIsLoading(true)
    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setUser(MOCK_USER)
    localStorage.setItem("ajo_user", JSON.stringify(MOCK_USER))
    setIsLoading(false)
  }

  const logout = async () => {
    setIsLoading(true)
    // Simulate logout delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    setUser(null)
    localStorage.removeItem("ajo_user")
    setIsLoading(false)
  }

  const getWalletAddress = () => {
    return user?.wallet.address || null
  }

  return (
    <PrivyContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
