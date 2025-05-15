import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { verifyPoolOnChain, getSolBalance } from "@/lib/solana/server"

export async function GET(request: NextRequest) {
  try {
    // Get the pool address from the query params
    const { searchParams } = new URL(request.url)
    const poolAddress = searchParams.get('poolAddress')
    const walletAddress = searchParams.get('walletAddress')
    
    if (!poolAddress) {
      return NextResponse.json({ error: "Missing pool address" }, { status: 400 })
    }
    
    // Verify if the pool exists on-chain
    const existsOnChain = await verifyPoolOnChain(poolAddress)
    
    // Get wallet SOL balance if provided
    let solBalance = null
    if (walletAddress) {
      solBalance = await getSolBalance(walletAddress)
    }
    
    // Get pool from database
    const supabase = createServerSupabaseClient()
    const { data: poolData } = await supabase
      .from("pools")
      .select("*")
      .eq("pool_address", poolAddress)
      .single()
      
    return NextResponse.json({
      existsOnChain,
      solBalance,
      poolData
    })
  } catch (error: any) {
    console.error("Error verifying pool:", error)
    return NextResponse.json({ 
      error: "Failed to verify pool", 
      details: error?.message || String(error)
    }, { status: 500 })
  }
} 