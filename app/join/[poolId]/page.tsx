"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { usePrivy } from "@/lib/privy"
import { usePoolDetails } from "@/lib/solana"
import { ArrowLeft, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { joinPool } from "@/lib/api"
import Link from "next/link"

export default function JoinPoolPage({ params }: { params: { poolId: string } }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: isLoadingAuth, login } = usePrivy()
  const { pool, isLoading: isLoadingPool, error: poolError } = usePoolDetails(params.poolId)

  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleJoin = async () => {
    if (!isAuthenticated) {
      await login()
      return
    }

    if (!user?.wallet.address) {
      setError("Please connect your wallet to join")
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      await joinPool(params.poolId, user.wallet.address)
      setSuccess("Successfully joined the pool!")

      // Redirect to dashboard after successful join
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      setError((err as Error).message || "Failed to join pool")
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoadingAuth || isLoadingPool) {
    return (
      <div className="container flex min-h-[70vh] items-center justify-center px-4 py-8 md:px-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (poolError || !pool) {
    return (
      <div className="container flex min-h-[70vh] items-center justify-center px-4 py-8 md:px-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Pool Not Found</CardTitle>
            <CardDescription>The savings pool you're looking for doesn't exist or has been deleted.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {poolError || "Unable to find the requested pool. Please check the pool ID and try again."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center px-4 py-8 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>Join Savings Pool</CardTitle>
            <CardDescription>You've been invited to join a savings pool</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-purple-50 p-4 dark:bg-purple-900/20">
              <h3 className="mb-2 text-lg font-bold">{pool.name}</h3>
              <p className="text-sm text-muted-foreground">{pool.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Contribution</p>
                  <p className="font-medium">
                    {pool.contributionAmount} {pool.contributionTokenSymbol}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Frequency</p>
                  <p className="font-medium capitalize">{pool.frequency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Members</p>
                  <p className="font-medium">
                    {pool.currentMembers}/{pool.totalMembers}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {new Date(pool.startDate).toLocaleDateString()} - {new Date(pool.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <Check className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700 sm:w-auto sm:flex-1"
              onClick={handleJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Pool"
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
