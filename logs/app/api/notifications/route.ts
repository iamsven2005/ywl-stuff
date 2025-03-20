import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/app/login/actions"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationId = Number.parseInt(params.id)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
    }

    // Get the notification with read status for the current user
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
      include: {
        reads: {
          where: {
            userId: user.id,
          },
        },
      },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Transform the data to include a read flag
    const transformedNotification = {
      id: notification.id,
      title: notification.title,
      content: notification.content,
      postDate: notification.postDate,
      expiryDate: notification.expiryDate,
      important: notification.important,
      read: notification.reads.length > 0,
      createdBy: notification.createdBy,
      createdAt: notification.createdAt,
    }

    return NextResponse.json(transformedNotification)
  } catch (error) {
    console.error("Error fetching notification:", error)
    return NextResponse.json({ error: "Failed to fetch notification" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationId = Number.parseInt(params.id)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
    }

    // Check if notification exists and was created by the current user
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Only allow the creator to delete the notification
    if (notification.createdBy !== user.id) {
      return NextResponse.json({ error: "Not authorized to delete this notification" }, { status: 403 })
    }

    // Delete the notification
    await db.notification.delete({
      where: { id: notificationId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationId = Number.parseInt(params.id)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
    }

    const data = await request.json()

    // Check if notification exists and was created by the current user
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Only allow the creator to update the notification
    if (notification.createdBy !== user.id) {
      return NextResponse.json({ error: "Not authorized to update this notification" }, { status: 403 })
    }

    // Update the notification
    const updatedNotification = await db.notification.update({
      where: { id: notificationId },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        content: data.content !== undefined ? data.content : undefined,
        important: data.important !== undefined ? data.important : undefined,
        expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : undefined,
      },
    })

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}

