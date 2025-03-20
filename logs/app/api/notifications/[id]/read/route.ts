import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/app/login/actions"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationId = Number.parseInt(params.id)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
    }

    // Check if notification exists
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Create or update the read record
    const readRecord = await db.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId: user.id,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        notificationId,
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true, readAt: readRecord.readAt })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}

