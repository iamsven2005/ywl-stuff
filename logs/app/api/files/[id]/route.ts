import fs from "fs"
import path from "path"
import { type NextRequest, NextResponse } from "next/server"
import { getAnswerWithFile } from "@/app/forms/[id]/actions"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const answerId = Number.parseInt(params.id)
    const answer = await getAnswerWithFile(answerId)

    if (!answer || !answer.fileUrl) {
      return new NextResponse("File not found", { status: 404 })
    }

    // Extract the filename from the fileUrl
    const filename = path.basename(answer.fileUrl)

    // Get the file path from the fileUrl - the fileUrl is stored as "/uploads/filename.ext"
    // but we need to get the actual path on the filesystem
    const filePath = path.join(process.cwd(), filename.startsWith("/") ? filename.substring(1) : filename)

    console.log("Looking for file at:", filePath)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // Try alternative path
      const altPath = path.join(process.cwd(), "uploads", path.basename(answer.fileUrl))
      console.log("File not found, trying alternative path:", altPath)

      if (!fs.existsSync(altPath)) {
        return new NextResponse(`File not found at ${filePath} or ${altPath}`, { status: 404 })
      }

      // Use the alternative path if the file exists there
      return serveFile(altPath)
    }

    return serveFile(filePath)

    // Helper function to serve the file with proper headers
    function serveFile(filepath: string) {
      // Read the file
      const fileBuffer = fs.readFileSync(filepath)

      // Get file extension to determine content type
      const fileExt = path.extname(filepath).toLowerCase()
      let contentType = "application/octet-stream" // Default content type

      // Set content type based on file extension
      if (fileExt === ".pdf") contentType = "application/pdf"
      else if (fileExt === ".jpg" || fileExt === ".jpeg") contentType = "image/jpeg"
      else if (fileExt === ".png") contentType = "image/png"
      else if (fileExt === ".txt") contentType = "text/plain"

      // Get original filename from the fileUrl
      const originalFilename = path.basename(answer.fileUrl)

      // Return the file
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${originalFilename}"`,
        },
      })
    }
  } catch (error) {
    console.error("Error retrieving file:", error)
    return new NextResponse("Internal Server Error: " + (error instanceof Error ? error.message : String(error)), {
      status: 500,
    })
  }
}
