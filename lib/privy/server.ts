import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createServerSupabaseClient } from "../supabase/client"

// Helper function to get the Privy user from the request
export async function getPrivyUser(request: NextRequest) {
  try {
    // Get the Privy token from the cookie
    const cookieStore = cookies()
    const privyToken = cookieStore.get("privy-token")?.value

    if (!privyToken) {
      return null
    }

    // Verify the token with Privy API
    // In a real implementation, you would use Privy's server SDK to verify the token
    // For this example, we'll assume the token is valid and extract the user ID

    // Extract the user ID from the token (simplified for example)
    const tokenParts = privyToken.split(".")
    if (tokenParts.length !== 3) {
      return null
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString())
    const privyId = payload.sub

    if (!privyId) {
      return null
    }

    // Get the user from Supabase
    const supabase = createServerSupabaseClient()
    const { data: user, error } = await supabase.from("users").select("*").eq("privy_id", privyId).single()

    if (error || !user) {
      return null
    }

    return {
      id: privyId,
      supabaseUser: user,
    }
  } catch (error) {
    console.error("Error getting Privy user:", error)
    return null
  }
}
