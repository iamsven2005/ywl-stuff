import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { messageId: string } }) {
  try {
    const messageId = Number.parseInt(params.messageId)

    if (isNaN(messageId)) {
      return NextResponse.json({ success: false, error: "Invalid message ID" }, { status: 400 })
    }

    const poll = await db.poll.findUnique({
      where: { messageId },
      select: { id: true },
    })

    if (!poll) {
      return NextResponse.json({ success: false, error: "Poll not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, pollId: poll.id })
  } catch (error) {
    console.error("Error fetching poll by message ID:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch poll" }, { status: 500 })
  }
}
