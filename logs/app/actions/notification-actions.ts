"use server"

import { db } from "@/lib/db"
import { getCurrentUser } from "@/app/login/actions"
import { revalidatePath } from "next/cache"

export async function getNotifications() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Not authenticated")
    }

    const notifications = await db.notification.findMany({
      orderBy: {
        postDate: "desc",
      },
      include: {
        reads: {
          where: {
            userId: user.id,
          },
        },
      },
    })

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      content: notification.content,
      postDate: notification.postDate,
      expiryDate: notification.expiryDate,
      important: notification.important,
      read: notification.reads.length > 0,
    }))
  } catch (error) {
    console.error("Error fetching notifications:", error)
    throw error
  }
}

export async function markNotificationAsRead(notificationId: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Not authenticated")
    }

    // Check if already read
    const existingRead = await db.notificationRead.findUnique({
      where: {
        notificationId_userId: {
          notificationId,
          userId: user.id,
        },
      },
    })

    if (!existingRead) {
      await db.notificationRead.create({
        data: {
          notificationId,
          userId: user.id,
        },
      })
    }

    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

export async function createNotification(data: {
  title: string
  content: string
  expiryDate?: Date | null
  important: boolean
}) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Not authenticated")
    }

    if (user.role !== "admin") {
      throw new Error("Not authorized")
    }

    const notification = await db.notification.create({
      data: {
        title: data.title,
        content: data.content,
        expiryDate: data.expiryDate,
        important: data.important,
        createdBy: user.id,
      },
    })

    revalidatePath("/admin/notifications")
    return { success: true, notification }
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

export async function updateNotification(
  id: number,
  data: {
    title: string
    content: string
    expiryDate?: Date | null
    important: boolean
  },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Not authenticated")
    }

    if (user.role !== "admin") {
      throw new Error("Not authorized")
    }

    const notification = await db.notification.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        expiryDate: data.expiryDate,
        important: data.important,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/admin/notifications")
    return { success: true, notification }
  } catch (error) {
    console.error("Error updating notification:", error)
    throw error
  }
}

export async function deleteNotification(id: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Not authenticated")
    }

    if (user.role !== "admin") {
      throw new Error("Not authorized")
    }

    await db.notification.delete({
      where: { id },
    })

    revalidatePath("/admin/notifications")
    return { success: true }
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

export async function getAllNotificationsAdmin() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Not authenticated")
    }

    if (user.role !== "admin") {
      throw new Error("Not authorized")
    }

    const notifications = await db.notification.findMany({
      orderBy: {
        postDate: "desc",
      },
      include: {
        reads: {
          select: {
            userId: true,
          },
        },
      },
    })

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      content: notification.content,
      postDate: notification.postDate,
      expiryDate: notification.expiryDate,
      important: notification.important,
      readCount: notification.reads.length,
    }))
  } catch (error) {
    console.error("Error fetching admin notifications:", error)
    throw error
  }
}

