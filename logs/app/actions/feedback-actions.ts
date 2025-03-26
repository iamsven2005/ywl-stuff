"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "../login/actions"

export async function getManagers() {
  try {
    const managers = await db.user.findMany({
        where: {
          role: {
            has: "manager",
          },
        },
      })
      
    return { success: true, managers }
  } catch (error) {
    console.error("Failed to fetch managers:", error)
    return { success: false, error: "Failed to fetch managers" }
  }
}

export async function submitFeedback(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, error: "You must be logged in to submit feedback" }
    }

    const subject = formData.get("subject") as string
    const message = formData.get("message") as string
    const recipientIds = formData.getAll("recipients") as string[]

    if (!subject || !message || recipientIds.length === 0) {
      return { success: false, error: "Please fill in all required fields and select at least one recipient" }
    }

    // Create the feedback
    const feedback = await db.feedback.create({
      data: {
        subject,
        message,
        senderId: currentUser.id,
        recipients: {
            create: recipientIds.map((id) => ({
              userId: Number(id),
            })),
          }
      },
    })

    revalidatePath("/feedback")
    revalidatePath("/feedback/sent")

    return { success: true, feedbackId: feedback.id }
  } catch (error) {
    console.error("Failed to submit feedback:", error)
    return { success: false, error: "Failed to submit feedback" }
  }
}

export async function getSentFeedback() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, error: "You must be logged in to view feedback" }
    }

    const feedback = await db.feedback.findMany({
      where: {
        senderId: currentUser.id,
      },
      include: {
        recipients: {
          include: {
            user: true
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, feedback }
  } catch (error) {
    console.error("Failed to fetch sent feedback:", error)
    return { success: false, error: "Failed to fetch sent feedback" }
  }
}

export async function getReceivedFeedback() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, error: "You must be logged in to view feedback" }
    }

    if (!currentUser.role.includes("manager") && !currentUser.role.includes("admin")) {
        return { success: false, error: "Only managers can view received feedback" }
    }

    const feedback = await db.feedback.findMany({
      where: {
        recipients: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      include: {
        sender: true
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, feedback }
  } catch (error) {
    console.error("Failed to fetch received feedback:", error)
    return { success: false, error: "Failed to fetch received feedback" }
  }
}

export async function markFeedbackAsRead(feedbackId: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, error: "You must be logged in" }
    }

    // Check if the user is a recipient of this feedback
    const feedbackRecipient = await db.feedbackRecipient.findFirst({
        where: {
            feedbackId: Number(feedbackId),
            userId: currentUser.id,
          }
          
    })

    if (!feedbackRecipient) {
      return { success: false, error: "You are not authorized to mark this feedback as read" }
    }

    await db.feedback.update({
        where: { id: Number(feedbackId) },
        data: { isRead: true },
      })
      

    revalidatePath("/feedback/received")

    return { success: true }
  } catch (error) {
    console.error("Failed to mark feedback as read:", error)
    return { success: false, error: "Failed to mark feedback as read" }
  }
}

