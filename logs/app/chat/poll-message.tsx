"use client"

import { useEffect, useState } from "react"
import { PollComponent } from "./poll-component"
import { getPollResults } from "../actions/poll-actions"

interface PollMessageProps {
  messageId: number
  userId: number
}

export function PollMessage({ messageId, userId }: PollMessageProps) {
  const [poll, setPoll] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setLoading(true)
        // First get the poll ID from the message ID
        const response = await fetch(`/api/polls/by-message/${messageId}`)
        const data = await response.json()

        if (data.success && data.pollId) {
          // Then get the poll details
          const pollData = await getPollResults(data.pollId)
          setPoll(pollData)
        } else {
          setError("Poll not found")
        }
      } catch (err) {
        console.error("Error fetching poll:", err)
        setError("Failed to load poll")
      } finally {
        setLoading(false)
      }
    }

    fetchPoll()
  }, [messageId])

  if (loading) {
    return <div className="p-4 text-center">Loading poll...</div>
  }

  if (error || !poll) {
    return <div className="p-4 text-center text-red-500">{error || "Poll not available"}</div>
  }

  return <PollComponent pollId={poll.id} userId={userId} initialPoll={poll} />
}
