import { notFound } from "next/navigation"
import { getPoolById } from "@/lib/api"
import { generateSlug } from "@/lib/slug"
import PoolDetailsContent from "@/components/PoolDetailsContent"

export default async function PoolDetailsPage({
  params,
}: {
  params: { poolId: string; slug: string }
}) {
  try {
    const pool = await getPoolById(params.poolId)

    // Verify the slug matches the pool name
    const correctSlug = generateSlug(pool.name)
    if (params.slug !== correctSlug) {
      return notFound()
    }

    return <PoolDetailsContent pool={pool} />
  } catch (error) {
    console.error("Error fetching pool:", error)
    return notFound()
  }
}
