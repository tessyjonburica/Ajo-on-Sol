"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, ChevronRight, Clock, DollarSign, Users } from "lucide-react"
import type { Pool } from "@/lib/solana"
import { formatDate, timeRemaining, formatCurrency, calculateProgress } from "@/lib/utils"
import { isPremiumPool } from "@/lib/subscription"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import PremiumBadge from "@/components/PremiumBadge"

interface PoolCardProps {
  pool: Pool
  index?: number
}

export default function PoolCard({ pool, index = 0 }: PoolCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const progressValue = calculateProgress(pool.currentMembers, pool.totalMembers)
  const isPremium = isPremiumPool(pool.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="overflow-hidden border-border/50 transition-all duration-300 hover:border-purple-300 hover:shadow-md dark:hover:border-purple-800">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">{pool.name}</CardTitle>
              {isPremium && <PremiumBadge type="pool" size="sm" />}
            </div>
            <div
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                pool.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{pool.description}</p>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Contribution</p>
                <p className="font-medium">{formatCurrency(pool.contributionAmount, pool.contributionTokenSymbol)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Frequency</p>
                <p className="font-medium capitalize">{pool.frequency}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Members</p>
                <p className="font-medium">
                  {pool.currentMembers}/{pool.totalMembers}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Next Payout</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="font-medium">{timeRemaining(pool.nextPayoutDate)}</p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatDate(pool.nextPayoutDate)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pool Progress</span>
              <span className="font-medium">{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {pool.yieldEnabled && (
            <div className="mt-3 rounded-md bg-purple-50 p-2 text-xs dark:bg-purple-900/20">
              <div className="flex items-center justify-between">
                <span className="text-purple-700 dark:text-purple-300">Yield Earning</span>
                <span className="font-medium text-purple-700 dark:text-purple-300">{pool.currentYield}% APY</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full gap-1 bg-purple-600 hover:bg-purple-700">
            <Link href={`/pool/${pool.id}`}>
              <span>View Details</span>
              <motion.div animate={{ x: isHovered ? 5 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
