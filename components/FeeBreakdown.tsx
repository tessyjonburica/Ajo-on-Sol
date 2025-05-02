import { Info } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"

interface FeeBreakdownProps {
  baseAmount: number
  platformFee: number
  latePenalty?: number
  totalAmount: number
  tokenSymbol: string
  isPremium?: boolean
  premiumDiscount?: number
  className?: string
  compact?: boolean
}

/**
 * A component that displays a breakdown of fees for a transaction
 */
export default function FeeBreakdown({
  baseAmount,
  platformFee,
  latePenalty = 0,
  totalAmount,
  tokenSymbol,
  isPremium = false,
  premiumDiscount = 0,
  className,
  compact = false,
}: FeeBreakdownProps) {
  if (compact) {
    return (
      <div className={cn("text-sm", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>Total with fees:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>
                    Base amount: {formatCurrency(baseAmount, tokenSymbol)}
                    <br />
                    Platform fee: {formatCurrency(platformFee, tokenSymbol)}
                    {latePenalty > 0 && (
                      <>
                        <br />
                        Late penalty: {formatCurrency(latePenalty, tokenSymbol)}
                      </>
                    )}
                    {isPremium && (
                      <>
                        <br />
                        Premium discount: {premiumDiscount * 100}%
                      </>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="font-medium">{formatCurrency(totalAmount, tokenSymbol)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-md border border-border p-3", className)}>
      <h4 className="mb-2 text-sm font-medium">Fee Breakdown</h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Base amount</span>
          <span>{formatCurrency(baseAmount, tokenSymbol)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Platform fee (0.5%)</span>
            {isPremium && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      -{premiumDiscount * 100}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Premium user discount applied</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <span>{formatCurrency(platformFee, tokenSymbol)}</span>
        </div>

        {latePenalty > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Late penalty (2%)</span>
              {isPremium && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        -{premiumDiscount * 100}%
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Premium user discount applied</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <span className="text-red-600 dark:text-red-400">{formatCurrency(latePenalty, tokenSymbol)}</span>
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between font-medium">
          <span>Total</span>
          <span>{formatCurrency(totalAmount, tokenSymbol)}</span>
        </div>
      </div>
    </div>
  )
}
