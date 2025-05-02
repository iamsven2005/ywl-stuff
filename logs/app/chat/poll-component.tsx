"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Users } from "lucide-react"
import { votePoll, getPollResults } from "../actions/poll-actions"

interface PollOption {
  id: number
  text: string
  pollId: number
}

interface PollVote {
  id: number
  userId: number
  optionId: number
  pollId: number
  user: {
    id: number
    username: string
  }
}

interface Poll {
  id: number
  question: string
  multiSelect: boolean
  messageId: number
  options: PollOption[]
  votes: PollVote[]
}

export function PollComponent({
  pollId,
  userId,
  initialPoll,
}: {
  pollId: number
  userId: number
  initialPoll: Poll
}) {
  const [poll, setPoll] = useState<Poll>(initialPoll)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [showVoters, setShowVoters] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user has already voted
  const hasVoted = poll.votes.some((vote) => vote.userId === userId)

  // Get total number of unique voters
  const uniqueVoters = new Set(poll.votes.map((vote) => vote.userId)).size

  // Calculate vote counts for each option
  const voteCounts = poll.options.map((option) => {
    const count = poll.votes.filter((vote) => vote.optionId === option.id).length
    const percentage = uniqueVoters > 0 ? Math.round((count / uniqueVoters) * 100) : 0
    return {
      optionId: option.id,
      count,
      percentage,
      voters: poll.votes.filter((vote) => vote.optionId === option.id).map((vote) => vote.user),
    }
  })

  // Fetch updated poll results periodically
  useEffect(() => {
    const fetchPollResults = async () => {
      try {
        const updatedPoll = await getPollResults(pollId)
        if (updatedPoll) {
          setPoll(updatedPoll)
        }
      } catch (error) {
        console.error("Failed to fetch poll results:", error)
      }
    }

    // Initial fetch
    fetchPollResults()

    // Set up polling interval (every 3 seconds)
    const intervalId = setInterval(fetchPollResults, 3000)

    return () => clearInterval(intervalId)
  }, [pollId])

  const handleOptionSelect = (optionId: number) => {
    if (poll.multiSelect) {
      // For multi-select polls
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      )
    } else {
      // For single-select polls
      setSelectedOptions([optionId])
    }
  }

  const handleVoteSubmit = async () => {
    if (selectedOptions.length === 0) return

    try {
      setIsSubmitting(true)
      await votePoll(pollId, selectedOptions)

      // Optimistically update UI
      const newVotes = selectedOptions.map((optionId) => ({
        id: Date.now() + optionId, // Temporary ID
        userId,
        optionId,
        pollId,
        user: {
          id: userId,
          username: "You", // Will be updated on next fetch
        },
      }))

      setPoll((prev) => ({
        ...prev,
        votes: [...prev.votes, ...newVotes],
      }))

      setSelectedOptions([])
    } catch (error) {
      console.error("Failed to submit vote:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get initials from username
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <h3 className="font-medium text-lg mb-3 text-primary">{poll.question}</h3>

      <div className="space-y-3 mb-4">
        {poll.options.map((option) => {
          const voteData = voteCounts.find((vc) => vc.optionId === option.id)
          const isSelected = selectedOptions.includes(option.id)

          return (
            <div key={option.id} className="space-y-1">
              {!hasVoted ? (
                <div className="flex items-start gap-2">
                  {poll.multiSelect ? (
                    <Checkbox
                      id={`option-${option.id}`}
                      checked={isSelected}
                      onCheckedChange={() => handleOptionSelect(option.id)}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <RadioGroup value={selectedOptions[0]?.toString()}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={option.id.toString()}
                          id={`option-${option.id}`}
                          checked={isSelected}
                          onClick={() => handleOptionSelect(option.id)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </RadioGroup>
                  )}
                  <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-primary">{option.text}</span>
                    <span className="text-sm text-muted-foreground">
                      {voteData?.count || 0} {voteData?.count === 1 ? "vote" : "votes"} ({voteData?.percentage || 0}%)
                    </span>
                  </div>
                  <Progress value={voteData?.percentage || 0} className="h-2" />

                  {showVoters && voteData?.voters && voteData.voters.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {voteData.voters.map((voter) => (
                        <div
                          key={voter.id}
                          className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs"
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">{getInitials(voter.username)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[100px]">{voter.username}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center">
        {!hasVoted ? (
          <Button onClick={handleVoteSubmit} disabled={selectedOptions.length === 0 || isSubmitting} size="sm">
            Vote
          </Button>
        ) : (
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>
              {uniqueVoters} {uniqueVoters === 1 ? "person" : "people"} voted
            </span>
          </div>
        )}

        {hasVoted && (
          <Button
            size="sm"
            onClick={() => setShowVoters(!showVoters)}
            className="flex items-center gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            {showVoters ? "Hide voters" : "Show voters"}
          </Button>
        )}
      </div>
    </div>
  )
}
