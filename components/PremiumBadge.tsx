import { Crown, Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface PremiumBadgeProps {
  type: "user" | "pool"
  size?: "sm" | "md" | "lg"
  className?: string
  showLabel?: boolean
}

/**
 * A badge component that indicates premium status for users or pools
 */
export default function PremiumBadge({ type, size = "md", className, showLabel = false }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: "text-xs py-0.5 px-1.5",
    md: "text-xs py-1 px-2",
    lg: "text-sm py-1 px-2.5",
  }

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-gradient-to-r",
              type === "user" ? "from-purple-500 to-indigo-500 text-white" : "from-amber-400 to-orange-500 text-white",
              sizeClasses[size],
              className,
            )}
          >
            {type === "user" ? (
              <Crown className={`h-${iconSize[size]} w-${iconSize[size]}`} />
            ) : (
              <Sparkles className={`h-${iconSize[size]} w-${iconSize[size]}`} />
            )}
            {showLabel && <span className="font-medium">{type === "user" ? "Premium User" : "Premium Pool"}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {type === "user" ? (
            <p>Premium user with reduced fees and access to premium pools</p>
          ) : (
            <p>Premium pool with yield farming and advanced features</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
