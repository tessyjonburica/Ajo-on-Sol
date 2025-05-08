// Add the Solana contract integration
import { type NextRequest, NextResponse } from "next/server"
import { getPrivyUserByAuthToken } from "@/lib/privy/server"
import { contributeToPool } from "@/lib/pools/actions"
import { verifyTransaction } from "@/lib/solana/client"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const poolId = params.id
    const { amount, transactionSignature } = await request.json()

    // Get the user from the auth token
    const authHeader = request.headers.get("authorization")
    let authToken = ""
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      authToken = authHeader.substring(7)
    } else {
      // Try to get token from cookies if not in header
      const cookieStore = request.cookies
      authToken = cookieStore.get("privy-token")?.value || ""
    }
    
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    const privyUser = await getPrivyUserByAuthToken(authToken)
    if (!privyUser) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    // Verify the transaction on the Solana blockchain
    const isVerified = await verifyTransaction(transactionSignature)
    if (!isVerified) {
      return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 })
    }

    // Record the contribution in the database
    const result = await contributeToPool(poolId, amount, transactionSignature, privyUser.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing contribution:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
