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

  // Check if user already exists
  const { data: existingUser } = await supabase.from("users").select("*").eq("privy_id", privyUser.id).single()

  // Upsert the user in Supabase
  const { data, error } = await supabase
    .from("users")
    .upsert({
      privy_id: privyUser.id,
      wallet_address: walletAddress,
      display_name: privyUser.name || null,
      email: privyUser.email?.address || null,
      avatar_url: privyUser.avatar || null,
      is_premium: existingUser?.is_premium || false, // Preserve premium status if exists
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

export async function updateUserProfile(
  privyId: string,
  updates: {
    display_name?: string
    avatar_url?: string
    email?: string
  },
) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("privy_id", privyId)
    .select()
    .single()

  if (error) {
    console.error("Error updating user profile:", error)
    throw error
  }

  revalidatePath("/settings")
  revalidatePath("/dashboard")

  return data
}
