import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { pollId, optionIds, userId } = await request.json()

    // Validate input
    if (!pollId || !optionIds || !optionIds.length || !userId) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
    }

    // Get the poll to check if it's multi-select
    const poll = await db.poll.findUnique({
      where: { id: pollId },
    })

    if (!poll) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 })
    }

    // If not multi-select, only allow one option
    const validOptionIds = poll.multiSelect ? optionIds : [optionIds[0]]

    // Delete existing votes by this user for this poll
    await db.pollVote.deleteMany({
      where: {
        pollId,
        userId,
      },
    })

    // Create new votes
    const votes = await Promise.all(
      validOptionIds.map((optionId: number) =>
        db.pollVote.create({
          data: {
            userId,
            optionId,
            pollId,
          },
        }),
      ),
    )

    return NextResponse.json({ success: true, votes })
  } catch (error) {
    console.error("Error voting on poll:", error)
    return NextResponse.json({ success: false, error: "Failed to vote on poll" }, { status: 500 })
  }
}
