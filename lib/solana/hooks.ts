"use client"

import { useEffect, useState } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import * as AjoContract from "./ajo-contract"

export function useAjoContract() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (wallet && wallet.publicKey && connection) {
      setIsReady(true)
    } else {
      setIsReady(false)
    }
  }, [wallet, connection])

  const getProvider = () => {
    if (!wallet || !connection) {
      throw new Error("Wallet or connection not available")
    }
    return AjoContract.getProvider(connection, wallet as any)
  }

  const initializePool = async (
    name: string,
    contributionAmount: number,
    contributionPeriod: number,
    maxMembers: number,
    startDate: Date,
    endDate: Date,
  ) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    return AjoContract.initializeAjoPool(
      provider,
      name,
      contributionAmount,
      contributionPeriod,
      maxMembers,
      startDate,
      endDate,
    )
  }

  const joinPool = async (ajoAccountAddress: string) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const ajoAccount = new PublicKey(ajoAccountAddress)
    return AjoContract.joinAjoPool(provider, ajoAccount)
  }

  const contribute = async (ajoAccountAddress: string, amount: number) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const ajoAccount = new PublicKey(ajoAccountAddress)
    return AjoContract.contributeToAjoPool(provider, ajoAccount, amount)
  }

  const processPayout = async (ajoAccountAddress: string, recipientAddress: string) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const ajoAccount = new PublicKey(ajoAccountAddress)
    const recipient = new PublicKey(recipientAddress)
    return AjoContract.processAjoPayout(provider, ajoAccount, recipient)
  }

  const createProposal = async (
    ajoAccountAddress: string,
    title: string,
    description: string,
    proposalType: "PayoutOrder" | "EmergencyWithdrawal" | "ExtendPool" | "RemoveMember" | "ChangeRules",
    executionData: Buffer | null,
    durationDays: number,
    proposalNumber: number,
  ) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const ajoAccount = new PublicKey(ajoAccountAddress)
    return AjoContract.createAjoProposal(
      provider,
      ajoAccount,
      title,
      description,
      proposalType,
      executionData,
      durationDays,
      proposalNumber,
    )
  }

  const voteOnProposal = async (
    ajoAccountAddress: string,
    proposalAccountAddress: string,
    vote: "Yes" | "No" | "Abstain",
  ) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const ajoAccount = new PublicKey(ajoAccountAddress)
    const proposalAccount = new PublicKey(proposalAccountAddress)
    return AjoContract.voteOnAjoProposal(provider, ajoAccount, proposalAccount, vote)
  }

  const executeProposal = async (ajoAccountAddress: string, proposalAccountAddress: string) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const ajoAccount = new PublicKey(ajoAccountAddress)
    const proposalAccount = new PublicKey(proposalAccountAddress)
    return AjoContract.executeAjoProposal(provider, ajoAccount, proposalAccount)
  }

  const emergencyWithdraw = async (ajoAccountAddress: string, recipientAddress: string, amount: number) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const ajoAccount = new PublicKey(ajoAccountAddress)
    const recipient = new PublicKey(recipientAddress)
    return AjoContract.emergencyWithdrawal(provider, ajoAccount, recipient, amount)
  }

  const getAjoAccount = async (ajoAccountAddress: string) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const ajoAccount = new PublicKey(ajoAccountAddress)
    return AjoContract.getAjoAccountData(provider, ajoAccount)
  }

  const getMemberAccount = async (memberAccountAddress: string) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const memberAccount = new PublicKey(memberAccountAddress)
    return AjoContract.getMemberAccountData(provider, memberAccount)
  }

  const getProposalAccount = async (proposalAccountAddress: string) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const proposalAccount = new PublicKey(proposalAccountAddress)
    return AjoContract.getProposalAccountData(provider, proposalAccount)
  }

  const getVoteAccount = async (voteAccountAddress: string) => {
    if (!isReady) throw new Error("Wallet not connected")
    const provider = getProvider()
    const voteAccount = new PublicKey(voteAccountAddress)
    return AjoContract.getVoteAccountData(provider, voteAccount)
  }

  return {
    isReady,
    initializePool,
    joinPool,
    contribute,
    processPayout,
    createProposal,
    voteOnProposal,
    executeProposal,
    emergencyWithdraw,
    getAjoAccount,
    getMemberAccount,
    getProposalAccount,
    getVoteAccount,
  }
}

export function useAjoPool(ajoAccountAddress: string | null) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [ajoAccount, setAjoAccount] = useState<any>(null)
  const [memberAccount, setMemberAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!ajoAccountAddress || !wallet?.publicKey || !connection) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const provider = AjoContract.getProvider(connection, wallet as any)
        const ajoPublicKey = new PublicKey(ajoAccountAddress)

        // Fetch Ajo account data
        const ajoData = await AjoContract.getAjoAccountData(provider, ajoPublicKey)
        setAjoAccount(ajoData)

        // Try to fetch member account data if the user is a member
        try {
          const [memberAccountPDA] = await AjoContract.findMemberAccountPDA(ajoPublicKey, wallet.publicKey)
          const memberData = await AjoContract.getMemberAccountData(provider, memberAccountPDA)
          setMemberAccount(memberData)
        } catch (err) {
          // User might not be a member, which is fine
          setMemberAccount(null)
        }
      } catch (err) {
        console.error("Error fetching Ajo pool data:", err)
        setError("Failed to load pool data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [ajoAccountAddress, wallet.publicKey, connection])

  return {
    ajoAccount,
    memberAccount,
    loading,
    error,
    isMember: !!memberAccount,
  }
}
