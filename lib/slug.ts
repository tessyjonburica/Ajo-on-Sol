export function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
      .trim()
  }
  
  export function getPoolUrl(poolId: string, poolName: string): string {
    const slug = generateSlug(poolName)
    return `/pool/${poolId}/${slug}`
  }
  
  export function getJoinPoolUrl(poolId: string, poolName: string): string {
    const slug = generateSlug(poolName)
    return `/join/${poolId}/${slug}`
  }
  
  export function getVotePoolUrl(poolId: string, poolName: string): string {
    const slug = generateSlug(poolName)
    return `/vote/${poolId}/${slug}`
  }
  