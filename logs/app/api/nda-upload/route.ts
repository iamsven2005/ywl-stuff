import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { logActivity } from "@/lib/activity-logger"
import { db } from "@/lib/db"
import { getUserById } from "@/app/actions/user-actions"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get form data from the request
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = Number.parseInt(formData.get("userId") as string)

    // Validate the request
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "No user ID provided" }, { status: 400 })
    }

    // Ensure the user can only upload for themselves unless they're an admin
    const currentuser = await getUserById(session.user.id)
    if(!currentuser){
        throw new Error("User not found")
    }
    const isAdmin = currentuser.role.includes("admin")
    const isSelf = Number.parseInt(session.user.id.toString()) === userId

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads", "nda")
    await mkdir(uploadsDir, { recursive: true })

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save file with user ID in filename
    const filename = `nda_${userId}_${Date.now()}.pdf`
    const filepath = path.join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    // Update user record with NDA file path
    await db.user.update({
      where: { id: userId },
      data: {
        ndafile: filename,
        updatedAt: new Date(),
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Uploaded NDA",
      targetType: "User",
      targetId: userId,
      details: "Uploaded NDA document",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error uploading NDA document:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

