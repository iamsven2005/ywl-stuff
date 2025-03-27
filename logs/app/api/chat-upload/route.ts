import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { logActivity } from "@/lib/activity-logger"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get form data from the request
    const formData = await request.formData()
    const file = formData.get("file") as File
    const groupId = Number.parseInt(formData.get("groupId") as string)
    const userId = Number.parseInt(session.user.id.toString())

    // Validate the request
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!groupId) {
      return NextResponse.json({ success: false, error: "No group ID provided" }, { status: 400 })
    }

    // Check if user is a member of the group
    const isMember = await db.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })

    if (!isMember) {
      return NextResponse.json({ success: false, error: "You are not a member of this group" }, { status: 403 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads", "chat")
    await mkdir(uploadsDir, { recursive: true })

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "pdf"

    // Save file with unique name
    const filename = `chat_${groupId}_${userId}_${Date.now()}.${fileExtension}`
    const filepath = path.join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    // Generate URL for the file
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const fileUrl = `${baseUrl}/api/chat-document/${filename}`

    // Create a message with the file attachment
    const message = await db.message.create({
      data: {
        content: `Shared a document: ${file.name}`,
        senderId: userId,
        groupId,
        fileAttachment: filename,
        fileOriginalName: file.name,
        fileType: file.type,
      },
    })

    // Update the group's updatedAt timestamp
    await db.group.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    })

    // Log the activity
    await logActivity({
      actionType: "Shared Document",
      targetType: "ChatGroup",
      targetId: groupId,
      details: `Shared document in chat group`,
    })

    return NextResponse.json({
      success: true,
      messageId: message.id,
      url: fileUrl,
    })
  } catch (error) {
    console.error("Error uploading chat document:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

