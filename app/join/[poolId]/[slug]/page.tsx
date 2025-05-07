import { notFound } from "next/navigation"
import { getPoolById } from "@/lib/api"
import { generateSlug } from "@/lib/slug"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import JoinPoolModal from "@/components/JoinPoolModal"

export default async function JoinPoolPage({
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

    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Join Pool: {pool.name}</CardTitle>
            <CardDescription>{pool.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Contribution Amount</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(pool.contributionAmount)} {pool.contributionFrequency}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Members</h3>
                  <p className="text-sm text-muted-foreground">
                    {pool.members?.length || 0} of {pool.maxMembers}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Start Date</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(pool.startDate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">End Date</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(pool.endDate)}</p>
                </div>
              </div>
            </div>

            <JoinPoolModal pool={pool} autoOpen={true} />
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error fetching pool:", error)
    return notFound()
  }
}
