"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useWallet } from '@solana/wallet-adapter-react'
import { usePoolDetails } from "@/lib/solana"
import { getPoolProposals } from "@/lib/api"
import { ArrowLeft, Loader2, Plus, Vote, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import VotePanel from "@/components/VotePanel"
import type { Proposal } from "@/components/VotePanel"

// Define Proposal type inline if not exported
// type Proposal = {
//   id: string
//   poolId: string
//   title: string
//   description: string
//   proposer: string
//   createdAt: string | Date
//   endsAt: string | Date
//   status: "active" | "passed" | "rejected"
//   options: string[]
//   votes: Record<string, number>
// }

export default function VotePage({ params }: { params: { poolId: string } }) {
  const { wallet } = useWallet()
  const { pool, isLoading: isLoadingPool } = usePoolDetails(params.poolId)
  const { publicKey, connected } = useWallet()

  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoadingProposals, setIsLoadingProposals] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)

  useEffect(() => {
    const fetchProposals = async () => {
      if (!params.poolId) return

      try {
        const data = await getPoolProposals(params.poolId)
        setProposals(data)

        // Select the first active proposal by default
        const activeProposal = data.find((p) => p.status === "active")
        if (activeProposal) {
          setSelectedProposal(activeProposal)
        } else if (data.length > 0) {
          setSelectedProposal(data[0])
        }
      } catch (error) {
        console.error("Failed to fetch proposals:", error)
      } finally {
        setIsLoadingProposals(false)
      }
    }

    fetchProposals()
  }, [params.poolId])

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || proposal.status === activeTab

    return matchesSearch && matchesTab
  })

  const handleRefresh = async () => {
    setIsLoadingProposals(true)
    try {
      const data = await getPoolProposals(params.poolId)
      setProposals(data)
    } catch (error) {
      console.error("Failed to refresh proposals:", error)
    } finally {
      setIsLoadingProposals(false)
    }
  }

  if (isLoadingPool) {
    return (
      <div className="container px-4 py-8 md:px-6">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4 gap-2 text-muted-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="container px-4 py-8 md:px-6">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4 gap-2 text-muted-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <h1 className="text-3xl font-bold tracking-tight">Pool Not Found</h1>
          <p className="text-muted-foreground">
            The savings pool you're looking for doesn't exist or has been deleted.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Pool Not Found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              The pool you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!connected || !publicKey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="mt-4 text-lg">Please connect your wallet to vote on proposals.</p>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 md:px-6">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4 gap-2 text-muted-foreground">
          <Link href={`/pool/${pool.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Pool Details
          </Link>
        </Button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold tracking-tight">Pool Governance</h1>
            <p className="text-muted-foreground">Vote on proposals for {pool.name}</p>
          </motion.div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isLoadingProposals}>
              {isLoadingProposals ? <Loader2 className="h-4 w-4 animate-spin" /> : <Vote className="h-4 w-4" />}
              Refresh
            </Button>
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4" />
              New Proposal
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Proposals</CardTitle>
              <CardDescription>Vote on important decisions for this pool</CardDescription>
              <div className="mt-2">
                <Input
                  placeholder="Search proposals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="passed">Passed</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>

              {isLoadingProposals ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredProposals.length > 0 ? (
                <div className="space-y-3">
                  {filteredProposals.map((proposal) => (
                    <motion.div
                      key={proposal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                          selectedProposal?.id === proposal.id
                            ? "border-purple-400 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/30"
                            : "border-border hover:border-purple-300 dark:hover:border-purple-800"
                        }`}
                        onClick={() => setSelectedProposal(proposal)}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{proposal.title}</h3>
                          <Badge
                            className={
                              proposal.status === "active"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/40"
                                : proposal.status === "passed"
                                  ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/40"
                                  : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40"
                            }
                          >
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{proposal.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <Vote className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No proposals found</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    {searchQuery
                      ? `No proposals matching "${searchQuery}"`
                      : activeTab === "active"
                        ? "There are no active proposals at the moment."
                        : activeTab === "passed"
                          ? "There are no passed proposals yet."
                          : "No proposals have been created for this pool yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedProposal ? (
            <VotePanel proposal={selectedProposal} onVoteSuccess={handleRefresh} walletAddress={publicKey ? publicKey.toBase58() : undefined} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                  <Vote className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Select a Proposal</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Select a proposal from the list to view details and cast your vote.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
