"use client"

import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint } from "@solana/spl-token"

// Initialize Solana connection
const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com")

// Convert SOL to lamports
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}

// Convert lamports to SOL
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL
}

// Get the SOL balance for a wallet
export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    return lamportsToSol(balance)
  } catch (error) {
    console.error("Error getting SOL balance:", error)
    throw error
  }
}

// Get the token balance for a wallet
export async function getTokenBalance(walletAddress: string, tokenMint: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress)
    const mintPublicKey = new PublicKey(tokenMint)

    // Get the associated token account
    const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, publicKey)

    // Get the token account info
    const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount)

    // Get the mint info to get decimals
    const mintInfo = await getMint(connection, mintPublicKey)

    // Calculate the actual balance
    return Number(tokenAccountInfo.value.amount) / Math.pow(10, mintInfo.decimals)
  } catch (error) {
    console.error("Error getting token balance:", error)
    // If the token account doesn't exist, return 0
    if ((error as any).message?.includes("TokenAccountNotFoundError")) {
      return 0
    }
    throw error
  }
}

// Create a contribution transaction
export async function createContributionTransaction(
  fromWallet: PublicKey,
  poolAddress: PublicKey,
  tokenMint: PublicKey,
  amount: number,
): Promise<Transaction> {
  try {
    // Get the mint info to get decimals
    const mintInfo = await getMint(connection, tokenMint)

    // Calculate the token amount with decimals
    const tokenAmount = amount * Math.pow(10, mintInfo.decimals)

    // Get the associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, fromWallet)

    const toTokenAccount = await getAssociatedTokenAddress(tokenMint, poolAddress)

    // Create the transfer instruction
    const transferInstruction = createTransferCheckedInstruction(
      fromTokenAccount,
      tokenMint,
      toTokenAccount,
      fromWallet,
      tokenAmount,
      mintInfo.decimals,
    )

    // Create the transaction
    const transaction = new Transaction().add(transferInstruction)

    // Get the recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromWallet

    return transaction
  } catch (error) {
    console.error("Error creating contribution transaction:", error)
    throw error
  }
}

// Create a payout transaction
export async function createPayoutTransaction(
  fromPoolWallet: PublicKey,
  toWallet: PublicKey,
  tokenMint: PublicKey,
  amount: number,
): Promise<Transaction> {
  try {
    // Get the mint info to get decimals
    const mintInfo = await getMint(connection, tokenMint)

    // Calculate the token amount with decimals
    const tokenAmount = amount * Math.pow(10, mintInfo.decimals)

    // Get the associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, fromPoolWallet)

    const toTokenAccount = await getAssociatedTokenAddress(tokenMint, toWallet)

    // Create the transfer instruction
    const transferInstruction = createTransferCheckedInstruction(
      fromTokenAccount,
      tokenMint,
      toTokenAccount,
      fromPoolWallet,
      tokenAmount,
      mintInfo.decimals,
    )

    // Create the transaction
    const transaction = new Transaction().add(transferInstruction)

    // Get the recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPoolWallet

    return transaction
  } catch (error) {
    console.error("Error creating payout transaction:", error)
    throw error
  }
}

// Verify a transaction on the Solana blockchain
export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    // Get the transaction details
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })

    // If transaction is null, it means it doesn't exist or hasn't been confirmed yet
    if (!transaction) {
      console.error("Transaction not found or not confirmed yet")
      return false
    }

    // Check if the transaction was successful
    if (transaction.meta && transaction.meta.err) {
      console.error("Transaction failed:", transaction.meta.err)
      return false
    }

    // Additional verification logic can be added here
    // For example, verify the sender, recipient, amount, etc.

    return true
  } catch (error) {
    console.error("Error verifying transaction:", error)
    return false
  }
}

// Export the connection for use in other files
export { connection }
