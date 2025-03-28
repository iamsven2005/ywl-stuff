import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join, dirname } from "path"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const ticketId = formData.get("ticketId") as string
    const commentId = formData.get("commentId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ticketId && !commentId) {
      return NextResponse.json({ error: "Either ticketId or commentId must be provided" }, { status: 400 })
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const originalFilename = file.name
    const fileExtension = originalFilename.split(".").pop() || ""
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase()
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`

    // Create directory if it doesn't exist
    const uploadDir = join(process.cwd(), "uploads", "tickets")
    await mkdir(dirname(join(uploadDir, uniqueFilename)), { recursive: true })

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, uniqueFilename)
    await writeFile(filePath, buffer)

    // Save file info to database
    const attachment = await db.ticketAttachment.create({
      data: {
        filename: uniqueFilename,
        originalFilename: originalFilename,
        fileSize: file.size,
        mimeType: file.type,
        ticketId: ticketId ? Number.parseInt(ticketId) : null,
        commentId: commentId ? Number.parseInt(commentId) : null,
        uploaderId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        filename: attachment.filename,
        originalFilename: attachment.originalFilename,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
      },
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

