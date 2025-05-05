"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, CreditCard, RefreshCw, Wallet } from "lucide-react"
import { formatDate, formatCurrency, formatAddress } from "@/lib/utils"
import type { Transaction } from "@/lib/solana"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TransactionItemProps {
  transaction: Transaction
  showPoolInfo?: boolean
}

export default function TransactionItem({ transaction, showPoolInfo = false }: TransactionItemProps) {
  const [expanded, setExpanded] = useState(false)

  const getTypeIcon = () => {
    switch (transaction.type) {
      case "contribution":
        return <CreditCard className="h-5 w-5" />
      case "payout":
        return <Wallet className="h-5 w-5" />
      case "yield":
      case "withdrawal":
        return <RefreshCw className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const getTypeColor = () => {
    switch (transaction.type) {
      case "contribution":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
      case "payout":
        return "bg-green-100 text-green-600 dark:bg-green-900/30"
      case "yield":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
      case "withdrawal":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-900/30"
    }
  }

  const getAmountColor = () => {
    switch (transaction.type) {
      case "contribution":
        return "text-purple-600 dark:text-purple-400"
      case "payout":
        return "text-green-600 dark:text-green-400"
      case "yield":
        return "text-blue-600 dark:text-blue-400"
      case "withdrawal":
        return "text-amber-600 dark:text-amber-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getAmountPrefix = () => {
    return transaction.type === "contribution" ? "-" : "+"
  }

  // Mock pool data - in a real app, this would come from a lookup or be passed in
  const poolName =
    transaction.poolId === "pool_1"
      ? "Lagos Traders Group"
      : transaction.poolId === "pool_2"
        ? "Abuja Family Circle"
        : "Tech Startup Fund"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-md border border-border"
    >
      <div className="flex cursor-pointer items-center gap-4 p-3" onClick={() => setExpanded(!expanded)}>
        <div className={`rounded-full p-2 ${getTypeColor()}`}>{getTypeIcon()}</div>
        <div>
          <p className="font-medium capitalize">{transaction.type}</p>
          <p className="text-sm text-muted-foreground">{formatDate(transaction.timestamp)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className={`font-medium ${getAmountColor()}`}>
            {getAmountPrefix()}
            {formatCurrency(transaction.amount, transaction.tokenSymbol)}
          </p>
          <p className="text-xs text-muted-foreground">{transaction.status}</p>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </div>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border bg-muted/30 px-4 py-3"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {showPoolInfo && (
              <div className="col-span-2 mb-1">
                <span className="font-medium">Pool:</span>{" "}
                <span className="text-purple-600 dark:text-purple-400">{poolName}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">From:</span>{" "}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{formatAddress(transaction.sender)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{transaction.sender}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div>
              <span className="text-muted-foreground">To:</span>{" "}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{formatAddress(transaction.recipient)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{transaction.recipient}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>{" "}
              <span>{formatCurrency(transaction.amount, transaction.tokenSymbol)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>{" "}
              <span>{new Date(transaction.timestamp).toLocaleString()}</span>
            </div>
            <div className="col-span-2 mt-1">
              <span className="text-muted-foreground">Transaction ID:</span>{" "}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="link" className="h-auto p-0 text-xs">
                      {transaction.signature.substring(0, 12)}...
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{transaction.signature}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
