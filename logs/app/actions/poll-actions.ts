"use server"

import { db } from "@/lib/db"
import { group } from "console"
import { revalidatePath } from "next/cache"

// Create a new poll
export async function createPoll(
  groupId: number,
  question: string,
  options: string[],
  multiSelect: boolean,
  senderId: number,
) {
    console.log(senderId, groupId)
  try {
    // First create a message to hold the poll
    const message = await db.message.create({
      data: {
        content: `Poll: ${question}`,
        senderId,
        groupId,
        isPoll: true,
      },
    })

    // Then create the poll
    const poll = await db.poll.create({
      data: {
        question,
        multiSelect,
        messageId: message.id,
        options: {
          create: options.map((text) => ({ text })),
        },
      },
      include: {
        options: true,
        votes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    })

    revalidatePath(`/chat/${groupId}`)
    return { success: true, pollId: poll.id, messageId: message.id }
  } catch (error) {
    console.error("Failed to create poll:", error)
    return { success: false, error: "Failed to create poll" }
  }
}

// Vote on a poll
export async function votePoll(pollId: number, optionIds: number[]) {
  try {
    const userId = 1 // Replace with actual user ID from session

    // Delete any existing votes by this user for this poll
    await db.pollVote.deleteMany({
      where: {
        pollId,
        userId,
      },
    })

    // Create new votes
    const votes = await Promise.all(
      optionIds.map((optionId) =>
        db.pollVote.create({
          data: {
            userId,
            optionId,
            pollId,
          },
        }),
      ),
    )

    // Get the poll to find the group ID for revalidation
    const poll = await db.poll.findUnique({
      where: { id: pollId },
      include: { message: true },
    })

    if (poll?.message) {
      revalidatePath(`/chat/${poll.message.groupId}`)
    }

    return { success: true, votes }
  } catch (error) {
    console.error("Failed to vote on poll:", error)
    return { success: false, error: "Failed to vote on poll" }
  }
}

// Get poll results
export async function getPollResults(pollId: number) {
  try {
    const poll = await db.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true,
        votes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    })

    return poll
  } catch (error) {
    console.error("Failed to get poll results:", error)
    throw new Error("Failed to get poll results")
  }
}
