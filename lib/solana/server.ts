import { Connection, PublicKey } from "@solana/web3.js"

// Verify a Solana transaction
export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    // Connect to Solana mainnet or devnet
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed",
    )

    // Get the transaction details
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })

    // Check if the transaction exists and is confirmed
    return !!transaction && transaction.meta !== null && !transaction.meta.err
  } catch (error) {
    console.error("Error verifying transaction:", error)
    return false
  }
}

// Get token balances for a wallet
export async function getTokenBalances(walletAddress: string) {
  try {
    // Connect to Solana mainnet or devnet
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed",
    )

    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(walletAddress), {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    })

    return tokenAccounts.value.map((account) => {
      const accountData = account.account.data.parsed.info
      return {
        mint: accountData.mint,
        tokenAmount: accountData.tokenAmount,
        // Add other relevant fields
      }
    })
  } catch (error) {
    console.error("Error getting token balances:", error)
    return []
  }
}
