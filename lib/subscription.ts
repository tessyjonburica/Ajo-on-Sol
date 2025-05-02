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
  feature: "yield_farming" | "large_pool" | "custom_governance" | "reduced_fees",
  userAddress?: string,
  poolId?: string,
): boolean {
  switch (feature) {
    case "yield_farming":
    case "large_pool":
    case "custom_governance":
      // Pool premium features
      return poolId ? isPremiumPool(poolId) : false

    case "reduced_fees":
      // User premium feature
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
