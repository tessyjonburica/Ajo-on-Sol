"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import CreatePoolForm from "@/components/CreatePoolForm"
import AuthGate from "@/components/AuthGate"
import Link from "next/link"

export default function CreatePoolPage() {
  return (
    <AuthGate>
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
    </AuthGate>
  )
}
