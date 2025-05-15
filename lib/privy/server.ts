import { cookies } from "next/headers"
import { PrivyClient } from "@privy-io/server-auth"

// Initialize Privy client
const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!)

// Get the authenticated Privy user from the request
export async function getPrivyUser(request: Request) {
  try {
    // Get the authorization header or cookie
    const authHeader = request.headers.get("authorization")
    const cookieHeader = request.headers.get("cookie")

    let token = ""

    // Try to get token from Authorization header
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }
    // Try to get token from cookies
    else if (cookieHeader) {
      const cookieObj = parseCookies(cookieHeader)
      token = cookieObj["privy-token"] || ""
    }

    if (!token) {
      // Try to get token from Next.js cookies
      const cookieStore = cookies()
      token = cookieStore.get("privy-token")?.value || ""
    }

    if (!token) {
      return null
    }

    // Verify the token and get the claims
    const claims = await privy.verifyAuthToken(token)

    // Return a user object with the userId
    return {
      id: claims.userId,
      // Don't include wallets property as it doesn't exist on AuthTokenClaims
    }
  } catch (error) {
    console.error("Error getting Privy user:", error)
    return null
  }
}

// Add the missing function that's being called in the route
export async function getPrivyUserByAuthToken(token: string) {
  try {
    if (!token) {
      return null
    }

    // Verify the token and get the claims
    const claims = await privy.verifyAuthToken(token)

    // Return a user object with the userId
    return {
      id: claims.userId,
      // Don't include wallets property as it doesn't exist on AuthTokenClaims
    }
  } catch (error) {
    console.error("Error getting Privy user by auth token:", error)
    return null
  }
}

// Helper function to parse cookies from header
function parseCookies(cookieHeader: string) {
  return cookieHeader.split(";").reduce(
    (cookies, cookie) => {
      const [name, value] = cookie.trim().split("=")
      cookies[name] = value
      return cookies
    },
    {} as Record<string, string>,
  )
}
