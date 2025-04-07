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

    const userId = Number(session.user.id)
    const { filename } = params

    if (!filename) {
      return new NextResponse("Invalid filename", { status: 400 })
    }

    // Extract file information from the filename
    // Format: timestamp-userId-originalFilename
    const filenameParts = filename.split("-")
    if (filenameParts.length < 3) {
      return new NextResponse("Invalid file format", { status: 400 })
    }

    // Find the file in the database by URL
    const file = await db.driveFile.findFirst({
      where: {
        url: { contains: filename },
      },
      include: {
        permissions: true,
      },
    })

    if (!file) {
      return new NextResponse("File not found", { status: 404 })
    }

    // Check if the user has permission to access this file
    const hasAccess = file.ownerId === userId || file.permissions.some((p) => p.userId === userId)

    if (!hasAccess) {
      return new NextResponse("You don't have permission to access this file", { status: 403 })
    }

    // Get the file path
    const filePath = path.join(process.cwd(), "uploads", "drive", filename)

    try {
      // Check if file exists
      await fs.access(filePath)
    } catch (error) {
      return new NextResponse("File not found on server", { status: 404 })
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath)

    // Determine content type based on file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""
    let contentType = "application/octet-stream"

    // Map common extensions to MIME types
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      csv: "text/csv",
      html: "text/html",
      htm: "text/html",
      js: "text/javascript",
      css: "text/css",
      json: "application/json",
      xml: "application/xml",
      zip: "application/zip",
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      webm: "video/webm",
    }

    if (fileExtension && mimeTypes[fileExtension]) {
      contentType = mimeTypes[fileExtension]
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${file.name}"`,
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

