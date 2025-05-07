"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { usePrivyWithSupabase } from "@/lib/privy/hooks"
import { usePools, useTransactions, formatWalletAddress } from "@/lib/solana"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ArrowUpRight, Clock, CreditCard, Loader2, Plus, RefreshCw, Search, UserPlus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import AuthGate from "@/components/AuthGate"
import PoolCard from "@/components/PoolCard"
import JoinPoolModal from "@/components/JoinPoolModal"
import TransactionItem from "@/components/TransactionItem"
import { supabase } from "@/lib/supabase/client"

export default function DashboardPage() {
  const { privyUser, supabaseUser, loading: userLoading } = usePrivyWithSupabase()
  const { pools, isLoading: isLoadingPools, error: poolsError } = usePools(privyUser?.wallet?.address)
  const { transactions, isLoading: isLoadingTransactions } = useTransactions(privyUser?.wallet?.address)

  const [searchQuery, setSearchQuery] = useState("")
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredPools = pools.filter(
    (pool) =>
      pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)

    // Force refresh data by invalidating Supabase cache
    await Promise.all([
      supabase.from("pools").select("count").throwOnError(),
      supabase.from("contributions").select("count").throwOnError(),
      supabase.from("payouts").select("count").throwOnError(),
    ])

    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <AuthGate>
      <div className="container px-4 py-8 md:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Manage your savings pools and track your contributions</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            <JoinPoolModal
              trigger={
                <Button variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Join Pool
                </Button>
              }
              onSuccess={handleRefresh}
            />
            <Button asChild className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Link href="/create">
                <Plus className="h-4 w-4" />
                Create Pool
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Pools</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingPools || userLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{pools.filter((p) => p.status === "active").length}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Contributed</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingPools || userLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      pools.reduce((sum, pool) => sum + pool.totalContributed, 0),
                      "USDC",
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingPools || userLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : pools.length > 0 ? (
                  <div className="text-2xl font-bold">
                    {formatDate(
                      pools
                        .filter((p) => p.status === "active")
                        .sort((a, b) => a.nextPayoutDate.getTime() - b.nextPayoutDate.getTime())[0]?.nextPayoutDate ||
                        new Date(),
                    )}
                  </div>
                ) : (
                  <div className="text-lg font-medium text-muted-foreground">No pools</div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Wallet Address</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {privyUser?.wallet?.address ? (
                    <>
                      {formatWalletAddress(privyUser.wallet.address)}
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" asChild>
                        <a
                          href={`https://solscan.io/account/${privyUser.wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </Button>
                    </>
                  ) : (
                    <Skeleton className="h-5 w-28" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pools" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pools">My Pools</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="pools" className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoadingPools || userLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredPools.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {filteredPools.map((pool, index) => (
                    <PoolCard key={pool.id} pool={pool} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                    <Wallet className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No pools found</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    {searchQuery
                      ? `No pools matching "${searchQuery}"`
                      : "You haven't joined any savings pools yet. Create a new pool or join an existing one."}
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" className="gap-2" onClick={() => setIsJoinModalOpen(true)}>
                      <UserPlus className="h-4 w-4" />
                      Join Pool
                    </Button>
                    <Button asChild className="gap-2 bg-purple-600 hover:bg-purple-700">
                      <Link href="/create">
                        <Plus className="h-4 w-4" />
                        Create Pool
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>View your recent contributions and payouts</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions || userLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
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
                ) : transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <TransactionItem key={tx.id} transaction={tx} showPoolInfo />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                      <CreditCard className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">No transactions yet</h3>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      Once you contribute to a pool or receive a payout, your transactions will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGate>
  )
}
