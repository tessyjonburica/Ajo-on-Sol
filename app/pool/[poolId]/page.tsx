"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useWallet } from '@solana/wallet-adapter-react'
import { usePoolDetails, useTransactions } from "@/lib/solana"
import { formatDate, formatCurrency, formatAddress, timeRemaining } from "@/lib/utils"
import { getPoolProposals } from "@/lib/api"
import { isPremiumPool } from "@/lib/subscription"
import { isPoolCreator, isPoolMember } from "@/lib/roles"
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  Share2,
  Users,
  Vote,
  X,
  Check,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AuthGate from "@/components/AuthGate"
import ContributionPanel from "@/components/ContributionPanel"
import WithdrawButton from "@/components/WithdrawButton"
import PremiumBadge from "@/components/PremiumBadge"
import LockedFeatureBanner from "@/components/LockedFeatureBanner"
import PremiumUpgradeModal from "@/components/PremiumUpgradeModal"
import { copyToClipboard } from "@/lib/utils"
import TransactionItem from "@/components/TransactionItem"
import PoolSettings from "@/components/PoolSettings"

export default function PoolDetailsPage({ params }: { params: { poolId: string } }) {
  const { publicKey, connected } = useWallet()
  const { pool, isLoading: isLoadingPool, error: poolError } = usePoolDetails(params.poolId)
  const walletAddress = publicKey?.toBase58() || undefined
  const { transactions, isLoading: isLoadingTransactions } = useTransactions(walletAddress)

  const [activeTab, setActiveTab] = useState("overview")
  const [proposals, setProposals] = useState<any[]>([])
  const [isLoadingProposals, setIsLoadingProposals] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  // Filter transactions for this pool
  const poolTransactions = transactions.filter((tx) => tx.poolId === params.poolId)

  // Check permissions
  const isCreator = pool && walletAddress ? isPoolCreator(walletAddress, pool) : false
  const isMember = pool && walletAddress ? isPoolMember(walletAddress, pool) : false
  const isPremium = pool ? isPremiumPool(pool.id) : false

  // Load proposals
  useState(() => {
    const loadProposals = async () => {
      try {
        const data = await getPoolProposals(params.poolId)
        setProposals(data)
      } catch (error) {
        console.error("Failed to load proposals:", error)
      } finally {
        setIsLoadingProposals(false)
      }
    }

    if (pool) {
      loadProposals()
    }
  })

  const handleCopyInvite = async () => {
    if (pool) {
      const url = `${window.location.origin}/join/${pool.id}`
      const success = await copyToClipboard(url)

      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  if (isLoadingPool) {
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

            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </AuthGate>
    )
  }

  if (!pool) {
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
      </AuthGate>
    )
  }

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

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{pool.name}</h1>
                <Badge
                  className={
                    pool.status === "active"
                      ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/40"
                      : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/40"
                  }
                >
                  {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
                </Badge>
                {isPremium && <PremiumBadge type="pool" size="sm" />}
              </div>
              <p className="text-muted-foreground">{pool.description}</p>
            </motion.div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Refresh
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleCopyInvite}>
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Copied!" : "Share Invite"}
              </Button>
              {isCreator && !isPremium && (
                <Button
                  variant="outline"
                  className="gap-2 border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
                  onClick={() => setShowPremiumModal(true)}
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Pool
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Show locked feature banner for yield farming if not premium */}
        {pool.yieldEnabled && !isPremium && (
          <LockedFeatureBanner
            title="Yield Farming Requires Premium"
            description="Upgrade this pool to premium to enable yield farming and earn additional returns on your funds."
            featureType="pool"
            onUpgrade={() => setShowPremiumModal(true)}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex w-full flex-wrap sm:flex-nowrap">
                <TabsTrigger value="overview" className="flex-1 text-xs sm:text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex-1 text-xs sm:text-sm">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="votes" className="flex-1 text-xs sm:text-sm">
                  Votes
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 text-xs sm:text-sm">
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Pool Overview</CardTitle>
                    <CardDescription>Details and statistics about this savings pool</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Contribution</span>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(pool.contributionAmount, pool.contributionTokenSymbol)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Frequency</span>
                        </div>
                        <p className="font-medium capitalize">{pool.frequency}</p>
                      </div>

                      <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Members</span>
                        </div>
                        <p className="font-medium">
                          {pool.currentMembers}/{pool.totalMembers}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Next Payout</span>
                        </div>
                        <p className="font-medium">{timeRemaining(pool.nextPayoutDate)}</p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-medium">Pool Progress</h3>
                        <span className="text-sm text-muted-foreground">
                          {Math.round((pool.currentMembers / pool.totalMembers) * 100)}%
                        </span>
                      </div>
                      <Progress value={(pool.currentMembers / pool.totalMembers) * 100} className="h-2" />
                    </div>

                    <div className="rounded-lg border border-border p-4">
                      <h3 className="mb-3 text-sm font-medium">Pool Schedule</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span>{formatDate(pool.startDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span>{formatDate(pool.endDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Next Payout:</span>
                          <span>{formatDate(pool.nextPayoutDate)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Next Recipient:</span>
                          <span>{formatAddress(pool.nextPayoutMember)}</span>
                        </div>
                      </div>
                    </div>

                    {pool.yieldEnabled && (
                      <div className="rounded-lg border border-border bg-purple-50 p-4 dark:bg-purple-900/20">
                        <h3 className="mb-3 text-sm font-medium text-purple-800 dark:text-purple-300">
                          Yield Farming Enabled
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-purple-700 dark:text-purple-400">Current APY:</span>
                            <span className="font-medium text-purple-800 dark:text-purple-300">
                              {pool.currentYield}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-700 dark:text-purple-400">Provider:</span>
                            <span className="font-medium text-purple-800 dark:text-purple-300">Marinade Finance</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="mb-3 text-sm font-medium">Pool Members</h3>
                      <div className="flex -space-x-2 overflow-hidden">
                        {Array.from({ length: Math.min(5, pool.currentMembers) }).map((_, i) => (
                          <Avatar key={i} className="h-8 w-8 border-2 border-background">
                            <AvatarFallback className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                              {String.fromCharCode(65 + i)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {pool.currentMembers > 5 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-purple-100 text-purple-800 text-xs dark:bg-purple-900 dark:text-purple-300">
                            +{pool.currentMembers - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    {isMember && <WithdrawButton pool={pool} onSuccess={handleRefresh} />}
                    <Button asChild className="gap-2 bg-purple-600 hover:bg-purple-700">
                      <Link href={`/vote/${pool.id}`}>
                        <Vote className="h-4 w-4" />
                        View All Proposals
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Pool Transactions</CardTitle>
                    <CardDescription>History of contributions and payouts for this pool</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <div className="ml-auto">
                              <Skeleton className="h-5 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : poolTransactions.length > 0 ? (
                      <div className="space-y-4">
                        {poolTransactions.map((tx) => (
                          <TransactionItem key={tx.id} transaction={tx} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                          <CreditCard className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium">No transactions yet</h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                          Once you contribute to this pool or receive a payout, your transactions will appear here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="votes">
                <Card>
                  <CardHeader>
                    <CardTitle>Pool Proposals</CardTitle>
                    <CardDescription>Vote on important decisions for this pool</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingProposals ? (
                      <div className="space-y-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-6 w-48" />
                              <Skeleton className="h-6 w-20" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-24 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : proposals.length > 0 ? (
                      <div className="space-y-6">
                        {proposals.map((proposal) => (
                          <div key={proposal.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium">{proposal.title}</h3>
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
                            <p className="text-muted-foreground">{proposal.description}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Created by {formatAddress(proposal.proposer)}
                              </span>
                              <span className="text-muted-foreground">Ends: {formatDate(proposal.endsAt)}</span>
                            </div>
                            <Separator />
                          </div>
                        ))}

                        <div className="flex justify-center pt-4">
                          <Button asChild className="gap-2 bg-purple-600 hover:bg-purple-700">
                            <Link href={`/vote/${pool.id}`}>
                              <ChevronRight className="h-4 w-4" />
                              View All Proposals
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                          <Vote className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium">No active proposals</h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                          There are currently no proposals to vote on for this pool.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <PoolSettings
                  pool={pool}
                  onSuccess={handleRefresh}
                  onOpenPremiumModal={() => setShowPremiumModal(true)}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            {isMember ? (
              <ContributionPanel pool={pool} onSuccess={handleRefresh} />
            ) : (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Join This Pool</CardTitle>
                  <CardDescription>You need to join this pool to contribute</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">Not a Member</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    You need to join this savings pool before you can contribute or participate in votes.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full gap-2 bg-purple-600 hover:bg-purple-700">
                    <Link href={`/join/${pool.id}`}>
                      <Users className="h-4 w-4" />
                      Join Pool
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Premium upgrade modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        userAddress={walletAddress}
        poolId={pool.id}
        onSuccess={handleRefresh}
      />
    </AuthGate>
  )
}
