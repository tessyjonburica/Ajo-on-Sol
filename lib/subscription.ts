// Mock subscription data - in a real app, this would come from a database or blockchain
const premiumUsers = new Set<string>()
const premiumPools = new Set<string>()

// Subscription constants
export const USER_PREMIUM_MONTHLY_PRICE = 500 // ₦500/month
export const POOL_PREMIUM_MONTHLY_PRICE = 1000 // ₦1000/month

// Premium features
export const PREMIUM_USER_FEATURES = [
  "Access to premium pools",
  "Reduced platform fees (20% discount)",
  "Lower penalties for late contributions",
  "Enhanced analytics dashboard",
  "Priority customer support",
]

export const PREMIUM_POOL_FEATURES = [
  "Yield farming integration with Marinade Finance",
  "Flexible governance rules",
  "Larger pool size (up to 100 members)",
  "Custom payout schedules",
  "Advanced voting mechanisms",
]

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  // User features
  "Access to premium pools": "Join exclusive premium pools.",
  "Reduced platform fees (20% discount)": "Pay 20% less in platform fees.",
  "Lower penalties for late contributions": "Reduced penalties for late contributions.",
  "Enhanced analytics dashboard": "Access advanced analytics and insights.",
  "Priority customer support": "Get priority support from our team.",
  // Pool features
  "Yield farming integration with Marinade Finance": "Enable yield farming for higher returns.",
  "Flexible governance rules": "Customize pool governance rules.",
  "Larger pool size (up to 100 members)": "Increase your pool size up to 100 members.",
  "Custom payout schedules": "Set custom payout schedules for your pool.",
  "Advanced voting mechanisms": "Unlock advanced voting and governance features.",
}

/**
 * Check if a user has premium status
 * @param userAddress The wallet address of the user
 * @returns Boolean indicating if the user has premium status
 */
export function isPremiumUser(userAddress: string): boolean {
  return premiumUsers.has(userAddress)
}

/**
 * Check if a pool has premium status
 * @param poolId The ID of the pool
 * @returns Boolean indicating if the pool has premium status
 */
export function isPremiumPool(poolId: string): boolean {
  return premiumPools.has(poolId)
}

/**
 * Upgrade a user to premium status
 * @param userAddress The wallet address of the user
 * @returns Promise resolving to a boolean indicating success
 */
export async function upgradeUserToPremium(userAddress: string): Promise<boolean> {
  try {
    // In a real app, this would handle payment processing
    // and update a database or blockchain record

    // Mock implementation
    premiumUsers.add(userAddress)
    return true
  } catch (error) {
    console.error("Failed to upgrade user to premium:", error)
    return false
  }
}

/**
 * Upgrade a pool to premium status
 * @param poolId The ID of the pool
 * @param userAddress The wallet address of the user making the payment
 * @returns Promise resolving to a boolean indicating success
 */
export async function upgradePoolToPremium(poolId: string, userAddress: string): Promise<boolean> {
  try {
    // In a real app, this would handle payment processing
    // and update a database or blockchain record

    // Mock implementation
    premiumPools.add(poolId)
    return true
  } catch (error) {
    console.error("Failed to upgrade pool to premium:", error)
    return false
  }
}

/**
 * Check if a feature is available based on premium status
 * @param feature The feature to check
 * @param userAddress The user's wallet address
 * @param poolId Optional pool ID if checking a pool feature
 * @returns Boolean indicating if the feature is available
 */
export function isFeatureAvailable(
  feature: "yield_farming" | "large_pool" | "custom_governance" | "custom_schedule" | "reduced_fees",
  userAddress?: string,
  poolId?: string,
): boolean {
  switch (feature) {
    case "yield_farming":
    case "large_pool":
    case "custom_governance":
    case "custom_schedule": // treat as premium pool feature
      return poolId ? isPremiumPool(poolId) : false

    case "reduced_fees":
      return userAddress ? isPremiumUser(userAddress) : false

    default:
      return false
  }
}

/**
 * Get the subscription status for a user and/or pool
 * @param userAddress The user's wallet address
 * @param poolId Optional pool ID
 * @returns Object with subscription status information
 */
export function getSubscriptionStatus(userAddress?: string, poolId?: string) {
  return {
    userIsPremium: userAddress ? isPremiumUser(userAddress) : false,
    poolIsPremium: poolId ? isPremiumPool(poolId) : false,
    userPremiumPrice: USER_PREMIUM_MONTHLY_PRICE,
    poolPremiumPrice: POOL_PREMIUM_MONTHLY_PRICE,
  }
}

/**
 * Get the features available for upgrade based on current status
 * @param type The type of upgradeable entity ("user" or "pool")
 * @param userAddress The user's wallet address (optional)
 * @param poolId The pool ID (optional)
 * @returns Array of feature strings available for upgrade
 */
export function getUpgradeableFeatures(
  type: "user" | "pool",
  userAddress?: string,
  poolId?: string
): string[] {
  if (type === "user") {
    if (userAddress && isPremiumUser(userAddress)) return []
    return PREMIUM_USER_FEATURES
  }
  if (type === "pool") {
    if (poolId && isPremiumPool(poolId)) return []
    return PREMIUM_POOL_FEATURES
  }
  return []
}
