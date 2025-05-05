/**
 * Access control utility functions for Ajo on Sol
 * Handles permission checks for pool creators, members, and admins
 */

import type { Pool } from "./solana"

/**
 * Check if a user is the creator of a pool
 * @param userAddress The wallet address of the user
 * @param pool The pool object
 * @returns Boolean indicating if the user is the creator
 */
export function isPoolCreator(userAddress: string | undefined, pool: Pool): boolean {
  if (!userAddress) return false
  return pool.creator === userAddress
}

/**
 * Check if a user is a member of a pool
 * @param userAddress The wallet address of the user
 * @param pool The pool object
 * @returns Boolean indicating if the user is a member
 */
export function isPoolMember(userAddress: string | undefined, pool: Pool): boolean {
  if (!userAddress) return false
  return pool.members.includes(userAddress)
}

/**
 * Check if a user can edit a pool
 * Only creators can edit pools, and only if no one has joined yet (besides the creator)
 * @param userAddress The wallet address of the user
 * @param pool The pool object
 * @returns Boolean indicating if the user can edit the pool
 */
export function canEditPool(userAddress: string | undefined, pool: Pool): boolean {
  if (!isPoolCreator(userAddress, pool)) return false
  // Can only edit if no one else has joined (pool.currentMembers should be 1, just the creator)
  return pool.currentMembers <= 1
}

/**
 * Check if a user can delete a pool
 * Only creators can delete pools, and only if no one has joined yet
 * @param userAddress The wallet address of the user
 * @param pool The pool object
 * @returns Boolean indicating if the user can delete the pool
 */
export function canDeletePool(userAddress: string | undefined, pool: Pool): boolean {
  return canEditPool(userAddress, pool)
}

/**
 * Check if a user can contribute to a pool
 * Only members can contribute
 * @param userAddress The wallet address of the user
 * @param pool The pool object
 * @returns Boolean indicating if the user can contribute
 */
export function canContribute(userAddress: string | undefined, pool: Pool): boolean {
  return isPoolMember(userAddress, pool)
}

/**
 * Check if a user can withdraw from a pool
 * Only members can withdraw, and only if the pool allows it
 * @param userAddress The wallet address of the user
 * @param pool The pool object
 * @returns Boolean indicating if the user can withdraw
 */
export function canWithdraw(userAddress: string | undefined, pool: Pool): boolean {
  if (!isPoolMember(userAddress, pool)) return false
  // Additional logic for withdrawal eligibility could be added here
  return true
}

/**
 * Check if a user can create a proposal for a pool
 * Only members can create proposals
 * @param userAddress The wallet address of the user
 * @param pool The pool object
 * @returns Boolean indicating if the user can create a proposal
 */
export function canCreateProposal(userAddress: string | undefined, pool: Pool): boolean {
  return isPoolMember(userAddress, pool)
}

/**
 * Check if a user can vote on a proposal
 * Only members can vote
 * @param userAddress The wallet address of the user
 * @param pool The pool object
 * @returns Boolean indicating if the user can vote
 */
export function canVote(userAddress: string | undefined, pool: Pool): boolean {
  return isPoolMember(userAddress, pool)
}
