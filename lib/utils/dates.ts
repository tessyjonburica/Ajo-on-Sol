// Calculate the next payout date based on the frequency and member position
export function calculateNextPayoutDate(startDate: Date, frequency: "daily" | "weekly" | "biweekly" | "monthly", position: number = 1): Date {
  const nextDate = new Date(startDate)
  
  // For position 1 (first member), payout is after one frequency period
  // For subsequent positions, add additional periods
  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + (1 * position))
      break
    case "weekly":
      nextDate.setDate(nextDate.getDate() + (7 * position))
      break
    case "biweekly":
      nextDate.setDate(nextDate.getDate() + (14 * position))
      break
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + position)
      break
  }

  return nextDate
}

// Check if a contribution is late
export function isContributionLate(nextPayoutDate: Date, gracePeriodDays = 3): boolean {
  const now = new Date()
  const deadline = new Date(nextPayoutDate)
  deadline.setDate(deadline.getDate() - gracePeriodDays)

  return now > deadline
}

// Format a date for display
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// Calculate time remaining until a date
export function timeRemaining(date: Date | string): string {
  const targetDate = new Date(date)
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()

  if (diff <= 0) {
    return "Now"
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return `${days}d ${hours}h`
  }

  return `${hours}h`
}

/**
 * Calculate the number of cycles between two dates based on frequency
 */
export function calculateCyclesFromDates(
  startDate: Date,
  endDate: Date,
  frequency: "daily" | "weekly" | "biweekly" | "monthly"
): number {
  const diffTime = endDate.getTime() - startDate.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  
  switch (frequency) {
    case "daily":
      return Math.ceil(diffDays)
    case "weekly":
      return Math.ceil(diffDays / 7)
    case "biweekly":
      return Math.ceil(diffDays / 14)
    case "monthly":
      // Calculate months difference
      let months = (endDate.getFullYear() - startDate.getFullYear()) * 12
      months += endDate.getMonth() - startDate.getMonth()
      // Add 1 if we're past the same day of the month
      if (endDate.getDate() > startDate.getDate()) months += 1
      return Math.max(1, months) // At least 1 cycle
    default:
      return 1 // Default to 1 cycle
  }
}
  