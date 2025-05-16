import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { verifyTransaction, getSolBalance } from "@/lib/solana/server"
import { PublicKey } from "@solana/web3.js"
import { findPoolVaultPDA } from "@/lib/solana/ajo-contract"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the request body
    const body = await request.json()
    const walletAddress = body.wallet_address
    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the Supabase client
    const supabase = createServerSupabaseClient()

    // Get the user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the pool with the next payout member
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select(`
        *,
        next_payout_member:next_payout_member_id(id, wallet_address, display_name)
      `)
      .eq("id", params.id)
      .single()

    if (poolError || !pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 })
    }

    // Check if the user is the creator of the pool
    if (pool.creator_id !== user.id) {
      return NextResponse.json({ error: "Only the pool creator can process payouts" }, { status: 403 })
    }

    // Check if there's a next payout member
    if (!pool.next_payout_member_id || !pool.next_payout_member) {
      return NextResponse.json({ error: "No next payout member set for this pool" }, { status: 400 })
    }

    // Validate the transaction signature if provided
    if (body.transactionSignature) {
      const isVerified = await verifyTransaction(body.transactionSignature)
      if (!isVerified) {
        return NextResponse.json({ error: "Invalid transaction signature" }, { status: 400 })
      }

      // Use the stored procedure to process the payout in the database
      const { error: payoutError } = await supabase.rpc("process_payout_transaction", {
        p_pool_id: params.id,
        p_recipient_id: pool.next_payout_member_id,
        p_amount: pool.contribution_amount * pool.current_members,
        p_transaction_signature: body.transactionSignature,
      })

      if (payoutError) {
        return NextResponse.json({ error: "Failed to process payout", details: payoutError.message }, { status: 500 })
      }

      // Get the updated pool to return
      const { data: updatedPool, error: updatedPoolError } = await supabase
        .from("pools")
        .select(`
          *,
          next_payout_member:next_payout_member_id(id, wallet_address, display_name, avatar_url)
        `)
        .eq("id", params.id)
        .single()

      if (updatedPoolError) {
        return NextResponse.json({ error: "Failed to get updated pool", details: updatedPoolError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        pool: updatedPool,
      })
    } else {
      // If no transaction signature provided, prepare the transaction data
      // This is for the initial request before the transaction is signed
      
      // Check if the pool has enough balance
      const poolAddress = pool.pool_address
      if (!poolAddress) {
        return NextResponse.json({ error: "Pool address not found" }, { status: 400 })
      }
      
      // Calculate the expected payout amount
      const payoutAmount = pool.contribution_amount * pool.current_members
      
      // Get the current pool balance
      let poolBalance = 0
      try {
        poolBalance = await getSolBalance(poolAddress)
      } catch (error) {
        console.error("Error getting pool balance:", error)
        return NextResponse.json({ error: "Failed to get pool balance" }, { status: 500 })
      }
      
      // Check if the pool has enough funds
      if (poolBalance < payoutAmount) {
        return NextResponse.json({ 
          error: "Insufficient funds in pool", 
          details: `Pool balance: ${poolBalance} SOL, Required: ${payoutAmount} SOL`,
          poolBalance,
          requiredAmount: payoutAmount
        }, { status: 400 })
      }
      
      // Get the recipient wallet address
      const recipientWalletAddress = pool.next_payout_member.wallet_address
      if (!recipientWalletAddress) {
        return NextResponse.json({ error: "Recipient wallet address not found" }, { status: 400 })
      }
      
      // Get the pool vault PDA
      const poolPublicKey = new PublicKey(poolAddress)
      const [vaultPDA, _] = await findPoolVaultPDA(poolPublicKey)
      
      // Return the transaction data for the client to sign
      return NextResponse.json({
        success: true,
        transactionData: {
          poolAddress: poolAddress,
          recipientAddress: recipientWalletAddress,
          amount: payoutAmount,
          vaultPDA: vaultPDA.toString(),
        },
        poolBalance,
        payoutAmount,
      })
    }
  } catch (error) {
    console.error("Error in POST /api/pools/[id]/payout:", error)
    return NextResponse.json({ error: "Internal server error", details: error?.message || String(error) }, { status: 500 })
  }
}
