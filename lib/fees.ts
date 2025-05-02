/**
 * Fee calculation utilities for Ajo for Sol
 * Handles platform fees, penalties, and premium discounts
 */

import { isPremiumUser } from "./subscription"
import type { Pool } from "./solana"

// Fee constants
const PLATFORM_FEE_PERCENTAGE = 0.005 // 0.5%
const LATE_CONTRIBUTION_PENALTY_PERCENTAGE = 0.02 // 2%
const PREMIUM_USER_FEE_DISCOUNT = 0.2 // 20% discount for premium users

/**
 * Calculate the platform fee for a contribution
 * @param amount The contribution amount
 * @param userAddress The user's wallet address (for premium status check)
 * @returns The platform fee amount
 */
export function calculatePlatformFee(amount: number, userAddress?: string): number {
  const baseFee = amount * PLATFORM_FEE_PERCENTAGE

  // Apply discount for premium users
  if (userAddress && isPremiumUser(userAddress)) {
    return baseFee * (1 - PREMIUM_USER_FEE_DISCOUNT)
  }

  return baseFee
}

/**
 * Calculate the total amount including platform fee
 * @param amount The base amount
 * @param userAddress The user's wallet address (for premium status check)
 * @returns The total amount including fee
 */
export function calculateTotalWithFee(amount: number, userAddress?: string): number {
  const fee = calculatePlatformFee(amount, userAddress)
  return amount + fee
}

/**
 * Calculate the late contribution penalty
 * @param amount The contribution amount
 * @param userAddress The user's wallet address (for premium status check)
 * @returns The penalty amount
 */
export function calculateLatePenalty(amount: number, userAddress?: string): number {
  const basePenalty = amount * LATE_CONTRIBUTION_PENALTY_PERCENTAGE

  // Apply discount for premium users
  if (userAddress && isPremiumUser(userAddress)) {
    return basePenalty * (1 - PREMIUM_USER_FEE_DISCOUNT)
  }

  return basePenalty
}

/**
 * Check if a contribution is late based on the pool's schedule
 * @param pool The pool object
 * @param contributionDate The date of the contribution
 * @returns Boolean indicating if the contribution is late
 */
export function isContributionLate(pool: Pool, contributionDate: Date): boolean {
  // Implementation depends on the pool's contribution schedule
  // This is a simplified example
  const dueDate = new Date(pool.nextPayoutDate)
  dueDate.setDate(dueDate.getDate() - 3) // 3 days before payout is the deadline

  return contributionDate > dueDate
}

/**
 * Get the fee breakdown for a contribution
 * @param amount The contribution amount
 * @param userAddress The user's wallet address
 * @param pool The pool object
 * @param contributionDate The date of the contribution
 * @returns An object with the fee breakdown
 */
export function getFeeBreakdown(
  amount: number,
  userAddress: string | undefined,
  pool: Pool,
  contributionDate: Date = new Date(),
) {
  const platformFee = calculatePlatformFee(amount, userAddress)
  const isLate = isContributionLate(pool, contributionDate)
  const latePenalty = isLate ? calculateLatePenalty(amount, userAddress) : 0

  const totalFees = platformFee + latePenalty
  const totalAmount = amount + totalFees

  return {
    baseAmount: amount,
    platformFee,
    isLate,
    latePenalty,
    totalFees,
    totalAmount,
    isPremium: userAddress ? isPremiumUser(userAddress) : false,
    premiumDiscount: userAddress && isPremiumUser(userAddress) ? PREMIUM_USER_FEE_DISCOUNT : 0,
  }
}

/**
 * Format a fee amount for display
 * @param amount The fee amount
 * @param symbol The token symbol
 * @returns Formatted fee string
 */
export function formatFee(amount: number, symbol: string): string {
  return `${amount.toFixed(2)} ${symbol}`
}
