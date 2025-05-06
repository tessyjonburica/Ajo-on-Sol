// Generate a URL-friendly slug from a string
export function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
      .trim()
  }
  
  // Get the full URL for a pool
  export function getPoolUrl(poolId: string, poolName: string): string {
    const slug = generateSlug(poolName)
    return `/pool/${poolId}/${slug}`
  }
  
  // Get the full URL for joining a pool
  export function getJoinPoolUrl(poolId: string, poolName: string): string {
    const slug = generateSlug(poolName)
    return `/join/${poolId}/${slug}`
  }
  
  // Get the full URL for voting on a pool
  export function getVotePoolUrl(poolId: string, poolName: string): string {
    const slug = generateSlug(poolName)
    return `/vote/${poolId}/${slug}`
  }
  