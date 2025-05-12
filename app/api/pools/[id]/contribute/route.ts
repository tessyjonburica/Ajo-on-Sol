// Add the Solana contract integration
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { contributeToPool } from "@/lib/pools/actions"
import { verifyTransaction } from "@/lib/solana/client"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const poolId = params.id
    const { amount, transactionSignature, wallet_address } = await request.json()

    if (!wallet_address) {
      return NextResponse.json({ error: "Unauthorized - No wallet address provided" }, { status: 401 })
    }

    // Verify the transaction on the Solana blockchain
    const isVerified = await verifyTransaction(transactionSignature)
    if (!isVerified) {
      return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 })
    }

    // Record the contribution in the database
    const result = await contributeToPool(poolId, amount, transactionSignature, wallet_address)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing contribution:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
