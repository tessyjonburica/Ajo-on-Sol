import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor"
import { AnchorProvider, Program } from "@project-serum/anchor"
import bs58 from "bs58"
import fs from "fs"
import minimalIdl from "./minimal-ajo-idl.json"

// The program ID from the IDL
const PROGRAM_ID = new PublicKey("EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk")

// Get connection to Solana
export const getConnection = () => {
  return new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    "confirmed"
  )
}

// Helper function to create a server-side wallet from private key or keypair file
const getServerWallet = (): Keypair => {
  // Load from keypair file if provided
  if (process.env.SOLANA_KEYPAIR_PATH) {
    const secretKey = JSON.parse(
      fs.readFileSync(process.env.SOLANA_KEYPAIR_PATH, "utf-8")
    )
    return Keypair.fromSecretKey(new Uint8Array(secretKey))
  }
  // Otherwise load from a base58-encoded env var
  if (process.env.SOLANA_PRIVATE_KEY) {
    const secret = bs58.decode(process.env.SOLANA_PRIVATE_KEY)
    return Keypair.fromSecretKey(secret)
  }
  throw new Error(
    "Either SOLANA_KEYPAIR_PATH or SOLANA_PRIVATE_KEY environment variable must be set"
  )
}

// Helper function to create a server-side provider
const getServerProvider = () => {
  const connection = getConnection()
  const wallet = getServerWallet()
  return new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: async (tx) => {
        tx.partialSign(wallet)
        return tx
      },
      signAllTransactions: async (txs) => {
        return txs.map((tx) => {
          tx.partialSign(wallet)
          return tx
        })
      },
    },
    { preflightCommitment: "confirmed" }
  )
}

// Helper function to get the program, fetching IDL from on-chain with fallback
const getProgram = async (): Promise<Program> => {
  const provider = getServerProvider()
  
  // Use the minimal IDL directly without trying to fetch from chain
  // This is the IDL that we know works with our tests
  const idlData = minimalIdl as unknown as anchor.Idl
  
  console.log("Using fixed minimal IDL")
  
  // Log the types to verify
  const currencyType = idlData.types?.find(t => t.name === "currencyType")
  console.log("CurrencyType:", currencyType)
  
  const cyclePeriod = idlData.types?.find(t => t.name === "cyclePeriod")
  console.log("CyclePeriod:", cyclePeriod)

  return new Program(idlData, PROGRAM_ID, provider)
}

// Find PDAs
export const findPoolPDA = async (
  poolId: number,
  creatorPublicKey: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      creatorPublicKey.toBuffer(),
      new anchor.BN(poolId).toArrayLike(Buffer, "le", 8),
    ],
    PROGRAM_ID
  )
}

export const findMemberPDA = async (
  poolAccount: PublicKey,
  memberPublicKey: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("member"),
      poolAccount.toBuffer(),
      memberPublicKey.toBuffer(),
    ],
    PROGRAM_ID
  )
}

export const findVaultPDA = async (poolAccount: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), poolAccount.toBuffer()],
    PROGRAM_ID
  )
}

// Modified to prepare a transaction for frontend signing
export async function preparePoolCreationTransaction(
  name: string,
  contributionAmount: number,
  totalMembers: number,
  totalCycles: number,
  cyclePeriod: "weekly" | "monthly",
  creatorPosition: number,
  creatorWalletAddress: string
): Promise<{ transaction: string, poolAddress: string }> {
  try {
    const connection = getConnection()
    const program = await getProgram()
    const creatorPublicKey = new PublicKey(creatorWalletAddress)
    
    // Get a fresh blockhash first
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
    
    // Generate a unique pool ID seed and find its PDAs
    const poolId = Date.now()
    const [poolAccount, poolBump] = await findPoolPDA(poolId, creatorPublicKey)
    const [memberAccount] = await findMemberPDA(poolAccount, creatorPublicKey)
    const [vaultAccount] = await findVaultPDA(poolAccount)

    // Convert contribution amount to lamports (for SOL)
    const contributionAmountLamports = contributionAmount * 10 ** 9

    console.log("\n📤 Preparing Pool Creation Transaction:")
    console.log("1. Program ID:", PROGRAM_ID.toString())
    console.log("2. Creator wallet:", creatorPublicKey.toString())
    
    // Build the transaction including account creation instructions
    const transaction = await program.methods
      .createPool(
        new anchor.BN(poolId),
        { sol: {} },
        new anchor.BN(contributionAmountLamports),
        totalMembers,
        totalCycles,
        { [cyclePeriod === "weekly" ? "weekly" : "monthly"]: {} },
        creatorPosition,
        poolBump
      )
      .accounts({
        pool: poolAccount,
        member: memberAccount,
        vault: vaultAccount,
        creator: creatorPublicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .transaction()

    // Set the fresh blockhash and fee payer
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = creatorPublicKey

    // Only require the creator's signature
    transaction.setSigners(creatorPublicKey)

    // Log required signers for verification
    console.log("Transaction requires signatures from:", transaction.signatures.map(s => s.publicKey.toBase58()))
    
    // Serialize the transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    }).toString('base64')
    
    return {
      transaction: serializedTransaction,
      poolAddress: poolAccount.toBase58()
    }
  } catch (error) {
    console.error("Error preparing pool creation transaction:", error)
    throw error
  }
}

// Keep the original function for backward compatibility
export async function createPoolOnChain(
  name: string,
  contributionAmount: number,
  totalMembers: number,
  totalCycles: number,
  cyclePeriod: "weekly" | "monthly",
  creatorPosition: number,
  creatorWalletAddress: string
): Promise<{ poolAddress: string; txSignature: string }> {
  try {
    // This function now needs to be updated to work with the frontend signing approach
    // For now, throw a more helpful error
    throw new Error(
      "Direct pool creation is no longer supported. Use preparePoolCreationTransaction and have the user sign the transaction on the frontend."
    )
  } catch (error) {
    console.error("Error creating pool on chain:", error)
    throw error
  }
}

// Verify a Solana transaction
export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    // Connect to Solana mainnet or devnet
    const connection = getConnection()

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
    const connection = getConnection()

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

// Submit a signed transaction
export async function submitSignedTransaction(
  signedTransaction: string
): Promise<string> {
  try {
    const connection = getConnection()
    
    console.log("Received serialized transaction:", signedTransaction.slice(0, 50) + "...")
    
    // Deserialize and verify the transaction
    const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64'))
    console.log("Deserialized transaction details:", {
      signers: transaction.signatures.map(s => ({
        publicKey: s.publicKey.toBase58(),
        signature: s.signature ? 'present' : 'missing'
      })),
      recentBlockhash: transaction.recentBlockhash,
      feePayer: transaction.feePayer?.toBase58()
    })
    
    // Verify signatures
    const signatureVerified = transaction.signatures.every(sig => {
      if (!sig.signature) {
        console.log(`Missing signature for ${sig.publicKey.toBase58()}`)
        return false
      }
      console.log(`Found signature for ${sig.publicKey.toBase58()}`)
      return true
    })

    if (!signatureVerified) {
      throw new Error("Transaction is missing required signatures")
    }
    
    console.log("Submitting transaction to network...")
    
    // Send the transaction without modifying it
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 5 // Increase retry count
    })
    
    console.log("Waiting for transaction confirmation...")
    
    // Use a simplified confirmation strategy with timeout
    const startTime = Date.now()
    let status = null
    
    while (Date.now() - startTime < 60000) { // 60 second timeout
      try {
        status = await connection.getSignatureStatus(signature)
        
        if (status?.value) {
          if (status.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
          } else if (status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized') {
            console.log(`Transaction confirmed with status: ${status.value.confirmationStatus}`)
            return signature
          }
        }
        
        console.log("Waiting for confirmation...")
        await new Promise(resolve => setTimeout(resolve, 2000)) // Check every 2 seconds
      } catch (error) {
        console.error("Error checking confirmation:", error)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    // If we get here, we timed out waiting for confirmation
    throw new Error("Transaction confirmation timed out")
    
  } catch (error) {
    console.error("Error submitting signed transaction:", error)
    throw error
  }
}

// Add a function to verify if a pool exists on-chain
export async function verifyPoolOnChain(
  poolAddress: string
): Promise<boolean> {
  try {
    const connection = getConnection()
    
    // Get the account info
    const accountInfo = await connection.getAccountInfo(new PublicKey(poolAddress))
    
    // If account info exists and has data, the pool exists on-chain
    return !!accountInfo && accountInfo.data.length > 0
  } catch (error) {
    console.error("Error verifying pool on chain:", error)
    return false
  }
}

// Add a helper to get a user's SOL balance
export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection()
    const publicKey = new PublicKey(walletAddress)
    
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error("Error getting SOL balance:", error)
    return 0
  }
}
