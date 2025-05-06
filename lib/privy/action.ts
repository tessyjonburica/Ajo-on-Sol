"use server"

import { createServerSupabaseClient } from "../supabase/client"
import { revalidatePath } from "next/cache"

export async function syncUserWithSupabase(privyUser: any) {
  const supabase = createServerSupabaseClient()

  if (!privyUser) {
    throw new Error("No user provided")
  }

  // Get the user's wallet address from Privy
  let walletAddress = ""

  // For users with embedded wallets or connected wallets
  if (privyUser.wallet?.address) {
    walletAddress = privyUser.wallet.address
  } else if (privyUser.linkedAccounts?.length > 0) {
    // Find the first Solana wallet in linked accounts
    const solanaWallet = privyUser.linkedAccounts.find(
      (account: any) => account.type === "wallet" && account.chain === "solana",
    )
    if (solanaWallet) {
      walletAddress = solanaWallet.address
    }
  }

  if (!walletAddress) {
    throw new Error("No Solana wallet address found for user")
  }

  // Upsert the user in Supabase
  const { data, error } = await supabase
    .from("users")
    .upsert({
      privy_id: privyUser.id,
      wallet_address: walletAddress,
      display_name: privyUser.name || null,
      email: privyUser.email?.address || null,
      avatar_url: privyUser.avatar || null,
      is_premium: false, // Default to non-premium
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error upserting user in Supabase:", error)
    throw error
  }

  revalidatePath("/dashboard")
  return data
}

export async function getCurrentUser(privyId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("users").select("*").eq("privy_id", privyId).single()

  if (error) {
    console.error("Error fetching user from Supabase:", error)
    return null
  }

  return data
}
