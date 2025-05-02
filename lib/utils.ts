import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine class names with Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to local string
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// Format date with time
export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Calculate time remaining in days, hours
export function timeRemaining(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()

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

// Format currency
export function formatCurrency(amount: number, currency = "USDC"): string {
  return `${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })} ${currency}`
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Calculate progress percentage
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0
  return Math.min(Math.round((current / total) * 100), 100)
}

// Format wallet address
export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error("Failed to copy:", error)
    return false
  }
}
