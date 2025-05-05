"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePrivy } from "@/lib/privy"
import { voteOnProposal, type Proposal } from "@/lib/api"
import { formatDate, formatAddress } from "@/lib/utils"
import { AlertCircle, Check, Clock, Loader2, ThumbsDown, ThumbsUp, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface VotePanelProps {
  proposal: Proposal
  onVoteSuccess?: () => void
}

export default function VotePanel({ proposal, onVoteSuccess }: VotePanelProps) {
  const { user } = usePrivy()

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showVoters, setShowVoters] = useState(false)

  // Mock voters data - in a real app, this would come from the API
  const voters = [
    { address: "GgE5ZbLHqBUBgcYnwxPvCgTZtABVPXrNzq1aQP4RCLwL", name: "User 1", vote: "Approve", avatar: "U" },
    { address: "5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CertuqDcKij", name: "User 2", vote: "Approve", avatar: "A" },
    { address: "Dv2c4dvAL4V7coZEbS6fMrSyMDMzRxKyuQGkzzKZ42Wu", name: "User 3", vote: "Reject", avatar: "B" },
  ]

  const totalVotes = Object.values(proposal.votes).reduce((a, b) => a + b, 0)

  // Auto-dismiss success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }

    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const handleVote = async () => {
    if (!selectedOption) {
      setError("Please select an option to vote")
      return
    }

    if (!user?.wallet.address) {
      setError("Please connect your wallet to vote")
      return
    }

    setIsVoting(true)
    setError(null)
    setSuccess(null)

    try {
      const vote = selectedOption === "Approve" ? "yes" : "no"
      await voteOnProposal(proposal.poolId, proposal.id, user.wallet.address, vote)

      setSuccess("Your vote has been recorded successfully")
      if (onVoteSuccess) {
        onVoteSuccess()
      }
    } catch (err) {
      setError((err as Error).message || "Failed to submit vote")
    } finally {
      setIsVoting(false)
    }
  }

  const getVotePercentage = (option: string) => {
    if (totalVotes === 0) return 0
    return Math.round((proposal.votes[option] / totalVotes) * 100)
  }

  const getStatusColor = () => {
    if (proposal.status === "passed") return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
    if (proposal.status === "rejected") return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400"
    return "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
  }

  const isActive = proposal.status === "active"
  const timeRemaining = new Date(proposal.endsAt).getTime() - new Date().getTime()
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60 * 24)))
  const hoursRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))

  return (
    <Card className="w-full border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{proposal.title}</CardTitle>
            <CardDescription>{proposal.description}</CardDescription>
          </div>
          <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor()}`}>
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Proposer: {formatAddress(proposal.proposer)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Created: {formatDate(proposal.createdAt)}</span>
          </div>
          {isActive && (
            <div className="flex items-center gap-1 text-purple-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                Ends in: {daysRemaining}d {hoursRemaining}h
              </span>
            </div>
          )}
        </div>

        <div className="rounded-md border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Current Results</h3>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowVoters(!showVoters)}>
              {showVoters ? "Hide Voters" : "Show Voters"}
            </Button>
          </div>
          <div className="space-y-3">
            {proposal.options.map((option) => (
              <div key={option} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{option}</span>
                  <span className="font-medium">{getVotePercentage(option)}%</span>
                </div>
                <Progress value={getVotePercentage(option)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {proposal.votes[option] || 0} vote{proposal.votes[option] !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>

          {showVoters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 border-t border-border pt-4"
            >
              <h4 className="mb-2 text-sm font-medium">Recent Voters</h4>
              <div className="space-y-2">
                {voters.map((voter) => (
                  <div
                    key={voter.address}
                    className="flex items-center justify-between rounded-md border border-border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{voter.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{formatAddress(voter.address)}</span>
                    </div>
                    <span
                      className={`text-xs font-medium ${voter.vote === "Approve" ? "text-green-600" : "text-red-600"}`}
                    >
                      {voter.vote}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {isActive && (
          <div className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-medium">Cast Your Vote</h3>
            <RadioGroup value={selectedOption || ""} onValueChange={setSelectedOption} className="space-y-2">
              {proposal.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <Check className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {isActive && (
        <CardFooter>
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-1"
              onClick={() => setSelectedOption("Reject")}
              data-selected={selectedOption === "Reject"}
              disabled={isVoting}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>Reject</span>
            </Button>
            <Button
              className="flex-1 gap-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => setSelectedOption("Approve")}
              data-selected={selectedOption === "Approve"}
              disabled={isVoting}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Approve</span>
            </Button>
          </div>
        </CardFooter>
      )}

      {isActive && selectedOption && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-6 pb-6">
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleVote}
            disabled={isVoting || !selectedOption}
          >
            {isVoting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Vote...
              </>
            ) : (
              "Confirm Vote"
            )}
          </Button>
        </motion.div>
      )}
    </Card>
  )
}
