import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import fs from "fs/promises"
import path from "path"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const entryId = Number.parseInt(params.id)
    if (isNaN(entryId)) {
      return new NextResponse("Invalid entry ID", { status: 400 })
    }

    // Get the library entry to find the filename
    const entry = await db.libraryEntry.findUnique({
      where: { id: entryId },
      select: { attachmentFilename: true },
    })

    if (!entry || !entry.attachmentFilename) {
      return new NextResponse("Document not found", { status: 404 })
    }

    const filePath = path.join(process.cwd(), "uploads", "library", entry.attachmentFilename)

    try {
      // Check if file exists
      await fs.access(filePath)
    } catch (error) {
      return new NextResponse("Document file not found", { status: 404 })
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath)

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${entry.attachmentFilename}"`,
      },
    })
  } catch (error) {
    console.error("Error serving library document:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

