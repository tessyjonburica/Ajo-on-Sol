// Calculate the next payout date based on the frequency
export function calculateNextPayoutDate(startDate: Date, frequency: "daily" | "weekly" | "biweekly" | "monthly"): Date {
    const nextDate = new Date(startDate)
  
    switch (frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case "biweekly":
        nextDate.setDate(nextDate.getDate() + 14)
        break
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1)
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
  