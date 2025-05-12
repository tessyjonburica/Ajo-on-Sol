"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import CreatePoolForm from "@/components/CreatePoolForm"
import AuthGate from "@/components/AuthGate"
import Link from "next/link"
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function CreatePoolPage() {
  const { connected } = useWallet()
  const router = useRouter()
  // Redirect if not connected
  useEffect(() => {
    if (!connected) router.push('/')
  }, [connected, router])

  if (!connected) {
    return <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      <p className="mt-4 text-lg font-medium">Connecting wallet...</p>
    </div>
  }
  return (
    <div className="container px-4 py-8 md:px-6">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4 gap-2 text-muted-foreground">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold tracking-tight">Create a New Pool</h1>
          <p className="text-muted-foreground">Set up a new savings pool and invite members to join</p>
        </motion.div>
      </div>

      <div className="flex justify-center">
        <CreatePoolForm />
      </div>
    </div>
  )
}
