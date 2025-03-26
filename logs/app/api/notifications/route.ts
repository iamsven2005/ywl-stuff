import { type NextRequest, NextResponse } from "next/server"
import { getNotifications, getAllNotificationsAdmin } from "@/app/actions/notification-actions"
import { getCurrentUser } from "@/app/login/actions"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role.includes("admin")) {
      const notifications = await getAllNotificationsAdmin()
      return NextResponse.json(notifications)
    } else {
      const notifications = await getNotifications()
      return NextResponse.json(notifications)
    }
  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Create a new notification
    const notification = await db.notification.create({
      data: {
        title: data.title,
        content: data.content,
        important: data.important || false,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        createdBy: user.id,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

