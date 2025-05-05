/**
 * Premium features management for Ajo for Sol
 * Centralizes premium status checks and feature access control
 */

import { isPremiumUser, isPremiumPool } from "./subscription"

// Premium feature types
export type PremiumFeature =
  | "yield_farming" // Earn yield on pool funds
  | "large_pool" // Create pools with more than 20 members
  | "custom_governance" // Advanced voting mechanisms
  | "reduced_fees" // Lower platform fees
  | "priority_support" // Priority customer support
  | "analytics" // Advanced analytics dashboard
  | "custom_schedule" // Custom payout schedules
  | "emergency_withdraw" // Emergency withdrawal without voting

// Feature requirements
export const FEATURE_REQUIREMENTS: Record<
  PremiumFeature,
  { requiresUserPremium: boolean; requiresPoolPremium: boolean }
> = {
  yield_farming: { requiresUserPremium: false, requiresPoolPremium: true },
  large_pool: { requiresUserPremium: false, requiresPoolPremium: true },
  custom_governance: { requiresUserPremium: false, requiresPoolPremium: true },
  reduced_fees: { requiresUserPremium: true, requiresPoolPremium: false },
  priority_support: { requiresUserPremium: true, requiresPoolPremium: false },
  analytics: { requiresUserPremium: true, requiresPoolPremium: false },
  custom_schedule: { requiresUserPremium: false, requiresPoolPremium: true },
  emergency_withdraw: { requiresUserPremium: false, requiresPoolPremium: true },
}

// Feature descriptions for UI
export const FEATURE_DESCRIPTIONS: Record<PremiumFeature, string> = {
  yield_farming: "Earn additional yield on pool funds through DeFi integrations",
  large_pool: "Create pools with up to 100 members (standard limit is 20)",
  custom_governance: "Advanced voting mechanisms and governance rules",
  reduced_fees: "20% discount on all platform fees",
  priority_support: "Priority customer support with 24-hour response time",
  analytics: "Advanced analytics dashboard with detailed insights",
  custom_schedule: "Create custom payout schedules and contribution frequencies",
  emergency_withdraw: "Emergency withdrawal options with reduced penalties",
}

/**
 * Check if a feature is available based on premium status
 * @param feature The feature to check
 * @param userAddress The user's wallet address
 * @param poolId Optional pool ID if checking a pool feature
 * @returns Boolean indicating if the feature is available
 */
export function isFeatureAvailable(feature: PremiumFeature, userAddress?: string, poolId?: string): boolean {
  const requirements = FEATURE_REQUIREMENTS[feature]

  // Check user premium requirement
  if (requirements.requiresUserPremium) {
    if (!userAddress || !isPremiumUser(userAddress)) {
      return false
    }
  }

  // Check pool premium requirement
  if (requirements.requiresPoolPremium) {
    if (!poolId || !isPremiumPool(poolId)) {
      return false
    }
  }

  return true
}

/**
 * Get premium status information for a user and/or pool
 * @param userAddress The user's wallet address
 * @param poolId Optional pool ID
 * @returns Object with premium status information
 */
export function getPremiumStatus(userAddress?: string, poolId?: string) {
  const userIsPremium = userAddress ? isPremiumUser(userAddress) : false
  const poolIsPremium = poolId ? isPremiumPool(poolId) : false

  return {
    userIsPremium,
    poolIsPremium,
    availableFeatures: Object.entries(FEATURE_REQUIREMENTS).reduce(
      (acc, [feature, requirements]) => {
        const isAvailable =
          (!requirements.requiresUserPremium || userIsPremium) && (!requirements.requiresPoolPremium || poolIsPremium)

        return {
          ...acc,
          [feature]: isAvailable,
        }
      },
      {} as Record<string, boolean>,
    ),
  }
}

/**
 * Get a list of premium features that would become available if upgraded
 * @param type "user" or "pool" - the type of premium to check
 * @param userAddress The user's wallet address
 * @param poolId Optional pool ID
 * @returns Array of features that would become available
 */
export function getUpgradeableFeatures(type: "user" | "pool", userAddress?: string, poolId?: string): PremiumFeature[] {
  const currentStatus = getPremiumStatus(userAddress, poolId)

  return Object.entries(FEATURE_REQUIREMENTS)
    .filter(([feature, requirements]) => {
      // For user premium, only show features that require user premium and aren't already available
      if (type === "user") {
        return requirements.requiresUserPremium && !currentStatus.availableFeatures[feature]
      }

      // For pool premium, only show features that require pool premium and aren't already available
      return requirements.requiresPoolPremium && !currentStatus.availableFeatures[feature]
    })
    .map(([feature]) => feature as PremiumFeature)
}
