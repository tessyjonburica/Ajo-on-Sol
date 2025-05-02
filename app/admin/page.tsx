"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { usePrivy } from "@/lib/privy"
import { usePools } from "@/lib/solana"
import { ArrowLeft, ChevronRight, Clock, Edit, Loader2, MoreHorizontal, Plus, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AuthGate from "@/components/AuthGate"
import { formatDate } from "@/lib/utils"

export default function AdminPage() {
  const { user } = usePrivy()
  const { pools, isLoading: isLoadingPools } = usePools(user?.wallet.address)

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter pools where user is the creator
  const createdPools = pools.filter((pool) => pool.creator === user?.wallet.address)

  const filteredPools = createdPools.filter((pool) => {
    const matchesSearch =
      pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || pool.status === activeTab

    return matchesSearch && matchesTab
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
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
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage the pools you've created</p>
            </motion.div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Refresh
              </Button>
              <Button asChild className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Link href="/create">
                  <Plus className="h-4 w-4" />
                  Create Pool
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Pools</CardTitle>
            <CardDescription>Manage the savings pools you've created</CardDescription>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <Input
                placeholder="Search pools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sm:max-w-xs"
              />
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPools ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="ml-auto">
                      <Skeleton className="h-10 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPools.length > 0 ? (
              <div className="space-y-4">
                {filteredPools.map((pool) => (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-start justify-between gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{pool.name}</h3>
                        <Badge
                          className={
                            pool.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/40"
                              : pool.status === "pending"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/40"
                                : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40"
                          }
                        >
                          {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Created: {formatDate(pool.startDate)}</span>
                        <span>
                          Members: {pool.currentMembers}/{pool.totalMembers}
                        </span>
                        <span>
                          Contribution: {pool.contributionAmount} {pool.contributionTokenSymbol}
                        </span>
                      </div>
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Link href={`/pool/${pool.id}`}>View</Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex cursor-pointer items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Pool</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex cursor-pointer items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Pool Settings</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex cursor-pointer items-center text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Pool</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No pools found</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {searchQuery
                    ? `No pools matching "${searchQuery}"`
                    : activeTab !== "all"
                      ? `You don't have any ${activeTab} pools.`
                      : "You haven't created any pools yet. Create your first pool to get started."}
                </p>
                {!searchQuery && activeTab === "all" && (
                  <Button asChild className="mt-6 gap-2 bg-purple-600 hover:bg-purple-700">
                    <Link href="/create">
                      <Plus className="h-4 w-4" />
                      Create Pool
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
          {filteredPools.length > 0 && (
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPools.length} of {createdPools.length} pools
              </p>
              <Button variant="outline" size="sm" className="gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </AuthGate>
  )
}
