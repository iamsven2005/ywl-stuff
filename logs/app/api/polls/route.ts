import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { question, options, multiSelect, groupId, userId } = await request.json()

    // Validate input
    if (!question || !options || options.length < 2 || !groupId || !userId) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
    }

    // Create message first
    const message = await db.message.create({
      data: {
        content: `Poll: ${question}`,
        senderId: userId,
        groupId,
        isPoll: true,
      },
    })

    // Create poll
    const poll = await db.poll.create({
      data: {
        question,
        multiSelect: !!multiSelect,
        messageId: message.id,
        options: {
          create: options.map((text: string) => ({ text })),
        },
      },
    })

    return NextResponse.json({
      success: true,
      pollId: poll.id,
      messageId: message.id,
    })
  } catch (error) {
    console.error("Error creating poll:", error)
    return NextResponse.json({ success: false, error: "Failed to create poll" }, { status: 500 })
  }
}
