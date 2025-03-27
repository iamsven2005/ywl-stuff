import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import path from "path"
import fs from "fs/promises"
import { db } from "@/lib/db"
import { getUserById } from "@/app/actions/user-actions"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = Number.parseInt(params.id)
    const currentuser = await getUserById(session.user.id)
    if (!currentuser) {
        throw new Error("User not found")
      }
    const isAdmin = currentuser.role.includes("admin")
    const isSelf = currentuser.id === userId

    if (!isAdmin && !isSelf) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Get the user's NDA file
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { ndafile: true },
    })

    if (!user?.ndafile) {
      return new NextResponse("No document found", { status: 404 })
    }

    // Get the file path
    const filePath = path.join(process.cwd(), "uploads", "nda", user.ndafile)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch (error) {
      return new NextResponse("File not found", { status: 404 })
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath)

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${user.ndafile}"`,
      },
    })
  } catch (error) {
    console.error("Error serving NDA document:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

