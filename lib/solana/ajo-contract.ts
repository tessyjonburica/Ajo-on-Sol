import * as anchor from "@project-serum/anchor"
import { AnchorProvider, Program } from "@project-serum/anchor"
import { type Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import type { AnchorWallet } from "@solana/wallet-adapter-react"
import * as ajoIdl from "./fixed-ajo-idl.json"

// ✅ FIXED: Safer type assertion for the IDL
const IDL = ajoIdl as unknown as anchor.Idl

// The program ID from the IDL
export const PROGRAM_ID = new PublicKey("EiKhShgBVKz8bNY4eqAxQByS6CvsCeKVavxFhba38QFk")

// Helper function to create a provider
export const getProvider = (connection: Connection, wallet: AnchorWallet) => {
  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: "processed" })
  return provider
}

// Helper function to get the program
export const getProgram = (provider: AnchorProvider) => {
  return new Program(IDL, PROGRAM_ID, provider)
}


// Helper function to derive the Ajo account PDA
export const findAjoAccountPDA = async (name: string, authority: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from("ajo"), Buffer.from(name), authority.toBuffer()], PROGRAM_ID)
}

// Helper function to derive the Member account PDA
export const findMemberAccountPDA = async (ajoAccount: PublicKey, member: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from("member"), ajoAccount.toBuffer(), member.toBuffer()], PROGRAM_ID)
}

// Helper function to derive the Pool Vault PDA
export const findPoolVaultPDA = async (ajoAccount: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from("vault"), ajoAccount.toBuffer()], PROGRAM_ID)
}

// Helper function to derive the Proposal account PDA
export const findProposalAccountPDA = async (ajoAccount: PublicKey, proposalNumber: number) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("proposal"), ajoAccount.toBuffer(), Buffer.from([proposalNumber])],
    PROGRAM_ID,
  )
}

// Helper function to derive the Vote account PDA
export const findVoteAccountPDA = async (proposalAccount: PublicKey, voter: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), proposalAccount.toBuffer(), voter.toBuffer()],
    PROGRAM_ID,
  )
}

// Initialize a new Ajo pool
export const initializeAjoPool = async (
  provider: AnchorProvider,
  name: string,
  contributionAmount: number,
  contributionPeriod: number,
  maxMembers: number,
  startDate: Date,
  endDate: Date,
) => {
  const program = getProgram(provider)
  const [ajoAccount, bump] = await findAjoAccountPDA(name, provider.wallet.publicKey)

  const tx = await program.methods
    .initialize(
      name,
      new anchor.BN(contributionAmount * LAMPORTS_PER_SOL),
      new anchor.BN(contributionPeriod),
      maxMembers,
      new anchor.BN(Math.floor(startDate.getTime() / 1000)),
      new anchor.BN(Math.floor(endDate.getTime() / 1000)),
    )
    .accounts({
      authority: provider.wallet.publicKey,
      ajoAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { tx, ajoAccount }
}

// Join an existing Ajo pool
export const joinAjoPool = async (provider: AnchorProvider, ajoAccount: PublicKey) => {
  const program = getProgram(provider)
  const [memberAccount, bump] = await findMemberAccountPDA(ajoAccount, provider.wallet.publicKey)

  const tx = await program.methods
    .joinPool()
    .accounts({
      member: provider.wallet.publicKey,
      ajoAccount,
      memberAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { tx, memberAccount }
}

// Contribute to an Ajo pool
export const contributeToAjoPool = async (provider: AnchorProvider, ajoAccount: PublicKey, amount: number) => {
  const program = getProgram(provider)
  const [memberAccount, memberBump] = await findMemberAccountPDA(ajoAccount, provider.wallet.publicKey)
  const [poolVault, vaultBump] = await findPoolVaultPDA(ajoAccount)

  const tx = await program.methods
    .contribute(new anchor.BN(amount * LAMPORTS_PER_SOL))
    .accounts({
      member: provider.wallet.publicKey,
      ajoAccount,
      memberAccount,
      poolVault,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { tx }
}

// Process a payout for an Ajo pool
export const processAjoPayout = async (provider: AnchorProvider, ajoAccount: PublicKey, recipient: PublicKey) => {
  const program = getProgram(provider)
  const [recipientAccount, recipientBump] = await findMemberAccountPDA(ajoAccount, recipient)
  const [poolVault, vaultBump] = await findPoolVaultPDA(ajoAccount)

  const tx = await program.methods
    .processPayout()
    .accounts({
      authority: provider.wallet.publicKey,
      ajoAccount,
      recipient,
      recipientAccount,
      poolVault,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { tx }
}

// Create a proposal for an Ajo pool
export const createAjoProposal = async (
  provider: AnchorProvider,
  ajoAccount: PublicKey,
  title: string,
  description: string,
  proposalType: "PayoutOrder" | "EmergencyWithdrawal" | "ExtendPool" | "RemoveMember" | "ChangeRules",
  executionData: Buffer | null,
  durationDays: number,
  proposalNumber: number,
) => {
  const program = getProgram(provider)
  const [memberAccount, memberBump] = await findMemberAccountPDA(ajoAccount, provider.wallet.publicKey)
  const [proposalAccount, proposalBump] = await findProposalAccountPDA(ajoAccount, proposalNumber)

  const tx = await program.methods
    .createProposal(title, description, { [proposalType]: {} }, executionData ? executionData : null, durationDays)
    .accounts({
      proposer: provider.wallet.publicKey,
      ajoAccount,
      memberAccount,
      proposalAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { tx, proposalAccount }
}

// Vote on a proposal
export const voteOnAjoProposal = async (
  provider: AnchorProvider,
  ajoAccount: PublicKey,
  proposalAccount: PublicKey,
  vote: "Yes" | "No" | "Abstain",
) => {
  const program = getProgram(provider)
  const [memberAccount, memberBump] = await findMemberAccountPDA(ajoAccount, provider.wallet.publicKey)
  const [voteAccount, voteBump] = await findVoteAccountPDA(proposalAccount, provider.wallet.publicKey)

  const tx = await program.methods
    .voteOnProposal({ [vote]: {} })
    .accounts({
      voter: provider.wallet.publicKey,
      ajoAccount,
      memberAccount,
      proposalAccount,
      voteAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { tx, voteAccount }
}

// Execute a proposal
export const executeAjoProposal = async (
  provider: AnchorProvider,
  ajoAccount: PublicKey,
  proposalAccount: PublicKey,
) => {
  const program = getProgram(provider)

  const tx = await program.methods
    .executeProposal()
    .accounts({
      authority: provider.wallet.publicKey,
      ajoAccount,
      proposalAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { tx }
}

// Process an emergency withdrawal
export const emergencyWithdrawal = async (
  provider: AnchorProvider,
  ajoAccount: PublicKey,
  recipient: PublicKey,
  amount: number,
) => {
  const program = getProgram(provider)
  const [poolVault, vaultBump] = await findPoolVaultPDA(ajoAccount)

  const tx = await program.methods
    .emergencyWithdrawal(new anchor.BN(amount * LAMPORTS_PER_SOL))
    .accounts({
      authority: provider.wallet.publicKey,
      ajoAccount,
      recipient,
      poolVault,
      systemProgram: SystemProgram.programId,
    })
    .rpc()

  return { tx }
}

// Get Ajo account data
export const getAjoAccountData = async (provider: AnchorProvider, ajoAccount: PublicKey) => {
  const program = getProgram(provider)
  const accountData = await program.account.ajoAccount.fetch(ajoAccount)
  return accountData
}

// Get Member account data
export const getMemberAccountData = async (provider: AnchorProvider, memberAccount: PublicKey) => {
  const program = getProgram(provider)
  const accountData = await program.account.memberAccount.fetch(memberAccount)
  return accountData
}

// Get Proposal account data
export const getProposalAccountData = async (provider: AnchorProvider, proposalAccount: PublicKey) => {
  const program = getProgram(provider)
  const accountData = await program.account.proposalAccount.fetch(proposalAccount)
  return accountData
}

// Get Vote account data
export const getVoteAccountData = async (provider: AnchorProvider, voteAccount: PublicKey) => {
  const program = getProgram(provider)
  const accountData = await program.account.voteAccount.fetch(voteAccount)
  return accountData
}

// Emergency withdrawal from a pool
export const withdrawFromAjoPool = async (
  poolAddress: string,
  walletAddress: string,
  amount: number
) => {
  try {
    // This function should be called from the client-side
    // We need to get provider from client-side
    // Here we're assuming this function will be used with useAjoContract hook
    
    // For client-side implementation, this would be:
    // const provider = getProvider() - obtained from the client context
    // const ajoAccount = new PublicKey(poolAddress)
    // const recipient = new PublicKey(walletAddress)
    // return await emergencyWithdrawal(provider, ajoAccount, recipient, amount)
    
    throw new Error("This function should be called from the client-side with a wallet context")
  } catch (error) {
    console.error("Error withdrawing from pool:", error)
    throw error
  }
}
