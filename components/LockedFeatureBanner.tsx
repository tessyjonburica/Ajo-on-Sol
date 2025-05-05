"use client"

import { Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { MotionWrapper } from "./MotionWrapper"
import { type PremiumFeature, FEATURE_DESCRIPTIONS } from "@/lib/premium"

interface LockedFeatureBannerProps {
  title: string
  description?: string
  featureType: "user" | "pool"
  feature?: PremiumFeature
  onUpgrade?: () => void
  className?: string
  compact?: boolean
}

/**
 * A banner component that displays when a premium feature is locked
 * and prompts the user to upgrade
 */
export default function LockedFeatureBanner({
  title,
  description,
  featureType,
  feature,
  onUpgrade,
  className,
  compact = false,
}: LockedFeatureBannerProps) {
  const [isHovered, setIsHovered] = useState(false)

  // If a feature is provided but no description, use the standard description
  const featureDescription = description || (feature ? FEATURE_DESCRIPTIONS[feature] : undefined)

  if (compact) {
    return (
      <MotionWrapper
        className={cn(
          "flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <p className="text-sm font-medium">{title}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-200 bg-white text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
          onClick={onUpgrade}
        >
          Upgrade
        </Button>
      </MotionWrapper>
    )
  }

  return (
    <MotionWrapper className={className}>
      <Card
        className="overflow-hidden border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Lock className="h-6 w-6 text-amber-600 dark:text-amber-300" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300">{title}</h3>
            {featureDescription && <p className="text-sm text-amber-700 dark:text-amber-400">{featureDescription}</p>}
          </div>
          <Button
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
            onClick={onUpgrade}
          >
            <span>Upgrade to {featureType === "user" ? "Premium" : "Premium Pool"}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200"
              style={{ transform: isHovered ? "translateX(3px)" : "translateX(0)" }}
            />
          </Button>
        </CardContent>
      </Card>
    </MotionWrapper>
  )
}
