import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { getSolBalance, verifyTransaction } from "@/lib/solana/server";
import { connection, LAMPORTS_PER_SOL, PublicKey } from "@/lib/solana";
import { createPayoutTransaction } from "@/lib/solana/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the request body
    const body = await request.json();
    const { walletAddress, payoutDate } = body;
    
    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the Supabase client
    const supabase = createServerSupabaseClient();

    // Get the pool
    const { data: pool, error: poolError } = await supabase
      .from("pools")
      .select(`
        *,
        next_payout_member:next_payout_member_id(id, wallet_address, display_name)
      `)
      .eq("id", params.id)
      .single();

    if (poolError || !pool) {
      return NextResponse.json(
        { error: "Pool not found", details: poolError?.message },
        { status: 404 }
      );
    }

    // Get the user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found", details: userError?.message },
        { status: 404 }
      );
    }

    // Check if the user is a member of the pool
    const { data: membership, error: membershipError } = await supabase
      .from("pool_members")
      .select("*")
      .eq("pool_id", params.id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You are not a member of this pool", details: membershipError?.message },
        { status: 403 }
      );
    }

    // Calculate the payout amount (based on 5 members for testing)
    const payoutAmount = pool.contribution_amount * 5; // Simulate all 5 members contributing

    // Get the pool address to check balance
    const poolAddress = pool.pool_address;
    let poolBalance = 0;

    if (poolAddress) {
      try {
        poolBalance = await getSolBalance(poolAddress);
      } catch (error) {
        console.error("Error getting pool balance:", error);
      }
    }

    // Check if the pool has enough funds
    if (poolBalance < payoutAmount) {
      return NextResponse.json(
        { 
          error: "Insufficient funds in pool", 
          details: `Pool balance: ${poolBalance} SOL, Required: ${payoutAmount} SOL`,
          poolBalance,
          requiredAmount: payoutAmount
        },
        { status: 400 }
      );
    }

    // Record the test payout
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        pool_id: params.id,
        recipient_id: user.id,
        amount: payoutAmount,
        token: pool.contribution_token || "SOL",
        token_symbol: pool.contribution_token_symbol || "SOL",
        transaction_signature: "test-payout-" + Date.now(), // Placeholder for test
        status: "confirmed",
        payout_date: new Date().toISOString(),
        is_test: true,
      })
      .select()
      .single();

    if (payoutError) {
      console.error("Error recording test payout:", payoutError);
      return NextResponse.json(
        { error: "Failed to record test payout", details: payoutError.message },
        { status: 500 }
      );
    }

    // Simulate the payout transaction
    // In a real implementation, you would execute the actual Solana transaction
    // but for testing purposes, we'll just simulate it

    return NextResponse.json({
      success: true,
      message: "Test payout processed successfully",
      payout,
      poolBalance,
      payoutAmount,
    });
  } catch (error: any) {
    console.error("Error in test payout:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message || String(error) },
      { status: 500 }
    );
  }
} 