"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"
import { getCurrentUser } from "../login/actions"

// Types for ticket operations
export interface CreateTicketParams {
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  relatedDeviceId?: number | null
}

export interface UpdateTicketParams {
  id: number
  title?: string
  description?: string
  status?: "open" | "in_progress" | "resolved" | "closed"
  priority?: "low" | "medium" | "high" | "critical"
  assignedToId?: number | null
}

export interface AddCommentParams {
  ticketId: number
  content: string
}

// Get all tickets with filtering and pagination
export async function getTickets({
  search = "",
  status = "",
  priority = "",
  assignedToId = "",
  createdById = "",
  page = 1,
  pageSize = 10,
}: {
  search?: string
  status?: string
  priority?: string
  assignedToId?: string | number
  createdById?: string | number
  page?: number
  pageSize?: number
}) {
  try {
    const skip = (page - 1) * pageSize
    const where: any = {}

    // Add search condition if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Add status filter if provided
    if (status) {
      where.status = status
    }

    // Add priority filter if provided
    if (priority) {
      where.priority = priority
    }

    // Add assignedToId filter if provided
    if (assignedToId) {
      where.assignedToId = Number(assignedToId)
    }

    // Add createdById filter if provided
    if (createdById) {
      where.createdById = Number(createdById)
    }

    // Get total count for pagination
    const totalCount = await db.supportTicket.count({ where })
    const pageCount = Math.ceil(totalCount / pageSize)

    // Get tickets with pagination
    const tickets = await db.supportTicket.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        relatedDevice: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        {
          priority: "desc", // High priority first
        },
        {
          createdAt: "desc", // Newest first
        },
      ],
      skip,
      take: pageSize,
    })

    return {
      tickets,
      totalCount,
      pageCount,
    }
  } catch (error) {
    console.error("Error fetching tickets:", error)
    throw new Error("Failed to fetch tickets")
  }
}

// Get a single ticket by ID
export async function getTicketById(id: number) {
  try {
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        relatedDevice: {
          select: {
            id: true,
            name: true,
            ip_address: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (!ticket) {
      throw new Error("Ticket not found")
    }

    return ticket
  } catch (error) {
    console.error("Error fetching ticket:", error)
    throw new Error("Failed to fetch ticket")
  }
}

// Create a new ticket
export async function createTicket({ title, description, priority, relatedDeviceId }: CreateTicketParams) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error("You must be logged in to create a ticket")
    }

    const ticket = await db.supportTicket.create({
      data: {
        title,
        description,
        priority,
        createdById: currentUser.id,
        relatedDeviceId: relatedDeviceId || null,
      },
      include: {
        createdBy: {
          select: {
            username: true,
          },
        },
        relatedDevice: {
          select: {
            name: true,
          },
        },
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Created Ticket",
      targetType: "Ticket",
      targetId: ticket.id,
      details: `Created ticket: ${title} with priority: ${priority}`,
    })

    revalidatePath("/tickets")
    return ticket
  } catch (error) {
    console.error("Error creating ticket:", error)
    throw new Error("Failed to create ticket")
  }
}

// Update a ticket
export async function updateTicket({ id, title, description, status, priority, assignedToId }: UpdateTicketParams) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error("You must be logged in to update a ticket")
    }

    // Check if the user is an admin or the ticket creator
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      select: {
        createdById: true,
      },
    })

    if (!ticket) {
      throw new Error("Ticket not found")
    }

    // Only admins or the ticket creator can update tickets
    if (currentUser.role !== "admin" && ticket.createdById !== currentUser.id) {
      throw new Error("You don't have permission to update this ticket")
    }

    // Prepare update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId

    // Update the ticket
    const updatedTicket = await db.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            username: true,
          },
        },
      },
    })

    // Log the activity
    let activityDetails = `Updated ticket: ${updatedTicket.title}`
    if (status) activityDetails += `, status: ${status}`
    if (priority) activityDetails += `, priority: ${priority}`
    if (assignedToId) activityDetails += `, assigned to: ${updatedTicket.assignedTo?.username || "Unassigned"}`

    await logActivity({
      actionType: "Updated Ticket",
      targetType: "Ticket",
      targetId: id,
      details: activityDetails,
    })

    revalidatePath("/tickets")
    revalidatePath(`/tickets/${id}`)
    return updatedTicket
  } catch (error) {
    console.error("Error updating ticket:", error)
    throw new Error("Failed to update ticket")
  }
}

// Delete a ticket
export async function deleteTicket(id: number) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error("You must be logged in to delete a ticket")
    }

    // Check if the user is an admin or the ticket creator
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      select: {
        title: true,
        createdById: true,
      },
    })

    if (!ticket) {
      throw new Error("Ticket not found")
    }

    // Only admins or the ticket creator can delete tickets
    if (currentUser.role !== "admin" && ticket.createdById !== currentUser.id) {
      throw new Error("You don't have permission to delete this ticket")
    }

    // Delete the ticket
    await db.supportTicket.delete({
      where: { id },
    })

    // Log the activity
    await logActivity({
      actionType: "Deleted Ticket",
      targetType: "Ticket",
      targetId: id,
      details: `Deleted ticket: ${ticket.title}`,
    })

    revalidatePath("/tickets")
    return { success: true }
  } catch (error) {
    console.error("Error deleting ticket:", error)
    throw new Error("Failed to delete ticket")
  }
}

// Add a comment to a ticket
export async function addComment({ ticketId, content }: AddCommentParams) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error("You must be logged in to add a comment")
    }

    // Check if the ticket exists
    const ticket = await db.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        title: true,
      },
    })

    if (!ticket) {
      throw new Error("Ticket not found")
    }

    // Create the comment
    const comment = await db.ticketComment.create({
      data: {
        ticketId,
        userId: currentUser.id,
        content,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Added Comment",
      targetType: "Ticket",
      targetId: ticketId,
      details: `Added comment to ticket: ${ticket.title}`,
    })

    revalidatePath(`/tickets/${ticketId}`)
    return comment
  } catch (error) {
    console.error("Error adding comment:", error)
    throw new Error("Failed to add comment")
  }
}

// Delete a comment
export async function deleteComment(id: number) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error("You must be logged in to delete a comment")
    }

    // Check if the comment exists and belongs to the user
    const comment = await db.ticketComment.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!comment) {
      throw new Error("Comment not found")
    }

    // Only admins or the comment author can delete comments
    if (currentUser.role !== "admin" && comment.userId !== currentUser.id) {
      throw new Error("You don't have permission to delete this comment")
    }

    // Delete the comment
    await db.ticketComment.delete({
      where: { id },
    })

    // Log the activity
    await logActivity({
      actionType: "Deleted Comment",
      targetType: "Ticket",
      targetId: comment.ticket.id,
      details: `Deleted comment from ticket: ${comment.ticket.title}`,
    })

    revalidatePath(`/tickets/${comment.ticket.id}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting comment:", error)
    throw new Error("Failed to delete comment")
  }
}

// Get ticket statistics
export async function getTicketStats() {
  try {
    // Get counts by status
    const statusCounts = await db.supportTicket.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    })

    // Get counts by priority
    const priorityCounts = await db.supportTicket.groupBy({
      by: ["priority"],
      _count: {
        id: true,
      },
    })

    // Get recent tickets
    const recentTickets = await db.supportTicket.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    })

    // Format the results
    const formattedStatusCounts = statusCounts.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count.id
        return acc
      },
      {} as Record<string, number>,
    )

    const formattedPriorityCounts = priorityCounts.reduce(
      (acc, curr) => {
        acc[curr.priority] = curr._count.id
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      statusCounts: formattedStatusCounts,
      priorityCounts: formattedPriorityCounts,
      recentTickets,
      total: await db.supportTicket.count(),
    }
  } catch (error) {
    console.error("Error getting ticket stats:", error)
    throw new Error("Failed to get ticket statistics")
  }
}

