"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { formatDate, formatCurrency } from "@/lib/utils"
import { ArrowRight, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Pool } from "@/lib/solana"

interface PoolCardProps {
  pool: Pool
  index: number
}

export default function PoolCard({ pool, index }: PoolCardProps) {
  const statusColors = {
    active: "bg-green-500",
    pending: "bg-yellow-500",
    completed: "bg-blue-500",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge
              className={`${
                statusColors[pool.status as keyof typeof statusColors]
              } text-white hover:${statusColors[pool.status as keyof typeof statusColors]}`}
            >
              {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {pool.frequency.charAt(0).toUpperCase() + pool.frequency.slice(1)}
            </Badge>
          </div>
          <CardTitle className="line-clamp-1">{pool.name}</CardTitle>
          <CardDescription className="line-clamp-2">{pool.description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted p-2">
              <div className="text-xs font-medium text-muted-foreground">Contribution</div>
              <div className="mt-1 font-medium">
                {formatCurrency(pool.contributionAmount, pool.contributionTokenSymbol)}
              </div>
            </div>
            <div className="rounded-md bg-muted p-2">
              <div className="text-xs font-medium text-muted-foreground">Next Payout</div>
              <div className="mt-1 font-medium">{formatDate(pool.nextPayoutDate)}</div>
            </div>
            <div className="rounded-md bg-muted p-2">
              <div className="text-xs font-medium text-muted-foreground">Members</div>
              <div className="mt-1 flex items-center font-medium">
                <Users className="mr-1 h-3.5 w-3.5" />
                {pool.currentMembers}/{pool.totalMembers}
              </div>
            </div>
            <div className="rounded-md bg-muted p-2">
              <div className="text-xs font-medium text-muted-foreground">Total Contributed</div>
              <div className="mt-1 font-medium">
                {formatCurrency(pool.totalContributed, pool.contributionTokenSymbol)}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round((pool.currentMembers / pool.totalMembers) * 100)}%</span>
            </div>
            <Progress value={(pool.currentMembers / pool.totalMembers) * 100} className="h-1.5" />
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full gap-1 bg-purple-600 hover:bg-purple-700">
            <Link href={`/pool/${pool.id}/${pool.slug || pool.name.toLowerCase().replace(/\s+/g, "-")}`}>
              View Details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
