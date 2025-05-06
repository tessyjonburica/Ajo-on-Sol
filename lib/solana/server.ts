import { Connection } from "@solana/web3.js"

// Initialize Solana connection
const getConnection = () => {
  const endpoint = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com"
  return new Connection(endpoint)
}

// Verify a transaction on the Solana blockchain
export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    const connection = getConnection()

    // Get the transaction status
    const status = await connection.getSignatureStatus(signature)

    // Check if the transaction was confirmed
    return status.value !== null && status.value.confirmationStatus === "confirmed"
  } catch (error) {
    console.error("Error verifying transaction:", error)
    return false
  }
}
