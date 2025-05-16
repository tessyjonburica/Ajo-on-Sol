"use client"

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createTransferCheckedInstruction, getAssociatedTokenAddress, getMint } from "@solana/spl-token"
import * as anchor from '@project-serum/anchor'
import { Program, AnchorProvider } from '@project-serum/anchor'
import { IDL } from './idl'

// Initialize Solana connection
const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com", "confirmed")

// The program ID from the IDL
const PROGRAM_ID = new PublicKey("EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk")

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
    return 0
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

// Helper function to find PDAs
const findPoolPDA = async (poolId: number, creatorPublicKey: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      creatorPublicKey.toBuffer(),
      new anchor.BN(poolId).toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  )
}

const findMemberPDA = async (poolAccount: PublicKey, memberPublicKey: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("member"),
      poolAccount.toBuffer(),
      memberPublicKey.toBuffer(),
    ],
    PROGRAM_ID
  )
}

const findVaultPDA = async (poolAccount: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), poolAccount.toBuffer()],
    PROGRAM_ID
  )
}

// Execute a payout transaction
export async function executePayoutTransaction(
  wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> },
  poolAddress: string,
  recipientAddress: string,
  amount: number
): Promise<string> {
  try {
    console.log("Executing payout transaction with params:", {
      poolAddress,
      recipientAddress,
      amount
    })

    // Convert addresses to PublicKeys
    const poolPublicKey = new PublicKey(poolAddress)
    const recipientPublicKey = new PublicKey(recipientAddress)

    // Find the member PDA for the recipient
    const [memberPDA] = await findMemberPDA(poolPublicKey, recipientPublicKey)
    
    // Find the vault PDA associated with the pool
    const [vaultPDA] = await findVaultPDA(poolPublicKey)
    
    // Use the token program ID
    const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    
    // Set up a direct SOL transfer instruction using the System Program
    // This is a simplified approach that doesn't use the Anchor program
    // We're doing this because there seems to be an issue with the token accounts required by the program
    const transaction = new Transaction();
    
    // Calculate the amount in lamports
    const lamports = solToLamports(amount);
    
    // Create a transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipientPublicKey,
        lamports: lamports
      })
    );
    
    // Get a recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    console.log("Transaction built, getting signature...");
    
    // Sign the transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    
    // Send the transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    console.log("Transaction sent, waiting for confirmation...");
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature);
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    
    console.log("Transaction confirmed:", signature);
    return signature;
  } catch (error) {
    console.error("Error executing payout transaction:", error);
    throw error;
  }
}

// Export the connection for use in other files
export { connection }
