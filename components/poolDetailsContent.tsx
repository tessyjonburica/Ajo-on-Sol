"use client"

import { useState } from "react"
import type { Pool } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import ContributionPanel from "@/components/ContributionPanel"
import VotePanel from "@/components/VotePanel"
import WithdrawButton from "@/components/WithdrawButton"
import { usePrivy } from "@privy-io/react-auth"
import { useWallet } from "@solana/wallet-adapter-react"
import { isPoolMember, isPoolAdmin } from "@/lib/roles"
import { AnimatePresence } from "framer-motion"
import {MotionWrapper} from "@/components/MotionWrapper";
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Users, Wallet } from "lucide-react"
import FeeBreakdown from "@/components/FeeBreakdown"
import PoolSettings from "@/components/PoolSettings"

export default function PoolDetailsContent({ pool }: { pool: Pool }) {
  const { user } = usePrivy()
  const { publicKey } = useWallet()
  const [activeTab, setActiveTab] = useState("overview")

  const userAddress = publicKey?.toString() || ""
  const isMember = isPoolMember(pool, userAddress)
  const isAdmin = isPoolAdmin(pool, userAddress)

  const totalContributed = pool.totalContributed || 0
  const targetAmount = pool.contributionAmount * pool.maxMembers
  const percentFunded = (totalContributed / targetAmount) * 100

  const nextPayoutDate = new Date(pool.nextPayoutDate || Date.now())
  const daysUntilNextPayout = Math.ceil((nextPayoutDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <AnimatePresence mode="wait">
      <MotionWrapper>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/3 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold">{pool.name}</CardTitle>
                      <CardDescription className="mt-2">{pool.description}</CardDescription>
                    </div>
                    <Badge variant={pool.isActive ? "default" : "secondary"}>
                      {pool.isActive ? "Active" : "Completed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(totalContributed)} of {formatCurrency(targetAmount)} funded
                        </span>
                        <span className="text-sm font-medium">{Math.round(percentFunded)}%</span>
                      </div>
                      <Progress value={percentFunded} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Next Payout</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(nextPayoutDate)} ({daysUntilNextPayout} days)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Members</p>
                          <p className="text-sm text-muted-foreground">
                            {pool.members?.length || 0} of {pool.maxMembers}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Contribution</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(pool.contributionAmount)} {pool.contributionFrequency}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-2">Members</h3>
                      <div className="flex flex-wrap gap-2">
                        {pool.members?.map((member) => (
                          <Avatar key={member.address} className="h-8 w-8">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback>
                              {member.name?.substring(0, 2) || member.address.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full flex overflow-x-auto hide-scrollbar">
                  <TabsTrigger value="overview" className="flex-1">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="contributions" className="flex-1">
                    Contributions
                  </TabsTrigger>
                  <TabsTrigger value="payouts" className="flex-1">
                    Payouts
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger value="settings" className="flex-1">
                      Settings
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pool Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium">Start Date</h3>
                            <p className="text-sm text-muted-foreground">{formatDate(pool.startDate)}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">End Date</h3>
                            <p className="text-sm text-muted-foreground">{formatDate(pool.endDate)}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Token</h3>
                            <p className="text-sm text-muted-foreground">{pool.tokenSymbol}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Privacy</h3>
                            <p className="text-sm text-muted-foreground">{pool.isPrivate ? "Private" : "Public"}</p>
                          </div>
                        </div>

                        <Separator />

                        <FeeBreakdown amount={pool.contributionAmount} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contributions" className="mt-4">
                  <ContributionPanel pool={pool} />
                </TabsContent>

                <TabsContent value="payouts" className="mt-4">
                  <VotePanel pool={pool} />
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="settings" className="mt-4">
                    <PoolSettings pool={pool} />
                  </TabsContent>
                )}
              </Tabs>
            </div>

            <div className="w-full md:w-1/3 space-y-6">
              {isMember && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Next Contribution</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(pool.nextContributionDate || new Date())}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium">Your Position</h3>
                      <p className="text-sm text-muted-foreground">
                        {pool.userPosition ? `${pool.userPosition} of ${pool.maxMembers}` : "Not determined yet"}
                      </p>
                    </div>

                    <WithdrawButton pool={pool} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </MotionWrapper>
    </AnimatePresence>
  )
}
