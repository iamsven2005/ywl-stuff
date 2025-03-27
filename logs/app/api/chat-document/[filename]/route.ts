import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import fs from "fs/promises"
import path from "path"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { filename } = params
    if (!filename) {
      return new NextResponse("Invalid filename", { status: 400 })
    }

    // Extract group ID from filename (format: chat_groupId_userId_timestamp.ext)
    const groupIdMatch = filename.match(/^chat_(\d+)_/)
    if (!groupIdMatch || !groupIdMatch[1]) {
      return new NextResponse("Invalid file format", { status: 400 })
    }

    const groupId = Number.parseInt(groupIdMatch[1])
    const userId = Number.parseInt(session.user.id.toString())

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
      return new NextResponse("You don't have permission to access this file", { status: 403 })
    }

    // Get the message to find the original filename
    const message = await db.message.findFirst({
      where: { fileAttachment: filename },
      select: { fileOriginalName: true, fileType: true },
    })

    const filePath = path.join(process.cwd(), "uploads", "chat", filename)

    try {
      // Check if file exists
      await fs.access(filePath)
    } catch (error) {
      return new NextResponse("File not found", { status: 404 })
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath)

    // Determine content type
    let contentType = "application/octet-stream"
    if (message?.fileType) {
      contentType = message.fileType
    } else if (filename.endsWith(".pdf")) {
      contentType = "application/pdf"
    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
      contentType = "image/jpeg"
    } else if (filename.endsWith(".png")) {
      contentType = "image/png"
    } else if (filename.endsWith(".gif")) {
      contentType = "image/gif"
    } else if (filename.endsWith(".doc") || filename.endsWith(".docx")) {
      contentType = "application/msword"
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${message?.fileOriginalName || filename}"`,
      },
    })
  } catch (error) {
    console.error("Error serving chat document:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

