import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await db.$executeRawUnsafe(`ALTER SEQUENCE "DriveFolder_id_seq" RESTART WITH 1;`)

    // Delete all folders (if needed)
    await db.driveFolder.deleteMany()
  
    // Get all users
    const users = await db.user.findMany()
  
    // Create a root folder for each user
    for (const user of users) {
      await db.driveFolder.create({
        data: {
        id: user.id,
          name: "My Drive",
          parentId: null,
          ownerId: user.id,
        },
      })
  
      console.log(`Created root folder for user ${user.username} (ID: ${user.id})`)
    }

    return NextResponse.json({ success: "Done" }, { status: 200 })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}