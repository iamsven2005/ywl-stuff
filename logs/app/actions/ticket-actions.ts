"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"
import { getSession } from "@/lib/auth"

// Types
interface CreateTicketParams {
  title: string
  description: string
  priority: string
  relatedDeviceId?: number | null
  assignedToId?: number | null
}

interface UpdateTicketParams {
  id: number
  title?: string
  description?: string
  status?: string
  priority?: string
  assignedToId: string | number | null
  relatedDeviceId?: number | null
}

interface AddCommentParams {
  ticketId: number
  content: string
}

interface GetTicketsParams {
  status?: string
  priority?: string
  assignedToId?: number
  createdById?: number
  search?: string
  page?: number
  pageSize?: number
}

// Get all tickets with filtering and pagination
export async function getTickets({
  status,
  priority,
  assignedToId,
  createdById,
  search = "",
  page = 1,
  pageSize = 10,
}: GetTicketsParams) {
  try {
    // Build where conditions
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (assignedToId) {
      where.assignedToId = assignedToId
    }

    if (createdById) {
      where.createdById = createdById
    }

    if (search) {
      where.OR = [{ title: { contains: search } }, { description: { contains: search } }]
    }

    // Get total count for pagination
    const totalCount = await db.supportTicket.count({ where })

    // Get tickets with pagination
    const tickets = await db.supportTicket.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
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
            attachments: true,
          },
        },
      },
      orderBy: [
        {
          priority: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      tickets,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
    }
  } catch (error) {
    console.error("Error fetching tickets:", error)
    throw new Error("Failed to fetch tickets")
  }
}

// Get a single ticket by ID
export async function getTicket(id: number) {
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
        relatedDevice: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
            TicketAttachment: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    })

    return ticket
  } catch (error) {
    console.error("Error fetching ticket:", error)
    throw new Error("Failed to fetch ticket")
  }
}

// Create a new ticket
export async function createTicket(data: CreateTicketParams) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to create a ticket")
    }

    // Get user ID from session
    const userId = session.user.id

    const ticket = await db.supportTicket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        createdById: userId,
        relatedDeviceId: data.relatedDeviceId || null,
        assignedToId: data.assignedToId || null,
      },
    })

    await logActivity({
      actionType: "Created Ticket",
      targetType: "Ticket",
      targetId: ticket.id,
      details: `Created ticket: ${data.title}`,
    })

    revalidatePath("/tickets")
    return ticket
  } catch (error) {
    console.error("Error creating ticket:", error)
    throw new Error("Failed to create ticket")
  }
}

// Update a ticket
export async function updateTicket(data: UpdateTicketParams) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to update a ticket")
    }

    // Get the original ticket for logging
    const originalTicket = await db.supportTicket.findUnique({
      where: { id: data.id },
      select: {
        title: true,
        status: true,
        assignedToId: true,
      },
    })

    if (!originalTicket) {
      throw new Error("Ticket not found")
    }

    // Process assignedToId - convert string "unassigned" to null or string number to actual number
    let assignedToId: number | null = null

    if (data.assignedToId !== undefined) {
      if (data.assignedToId === "unassigned") {
        assignedToId = null
      } else if (typeof data.assignedToId === "string") {
        assignedToId = Number.parseInt(data.assignedToId, 10)
        if (isNaN(assignedToId)) {
          assignedToId = null
        }
      } else {
        assignedToId = data.assignedToId
      }
    }

    console.log("Updating ticket with assignedToId:", assignedToId)

    // Update the ticket
    const ticket = await db.supportTicket.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignedToId: assignedToId,
        relatedDeviceId: data.relatedDeviceId,
        updatedAt: new Date(),
      },
    })

    // Log changes
    let details = `Updated ticket: ${ticket.title}`
    if (data.status && data.status !== originalTicket.status) {
      details += `, Status changed from ${originalTicket.status} to ${data.status}`
    }
    if (data.assignedToId !== undefined && assignedToId !== originalTicket.assignedToId) {
      details += `, Assignment changed`
    }

    await logActivity({
      actionType: "Updated Ticket",
      targetType: "Ticket",
      targetId: ticket.id,
      details,
    })

    revalidatePath(`/tickets/${data.id}`)
    revalidatePath("/tickets")
    return ticket
  } catch (error) {
    console.error("Error updating ticket:", error)
    throw new Error("Failed to update ticket")
  }
}

// Delete a ticket
export async function deleteTicket(id: number) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to delete a ticket")
    }

    // Get user role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    // Only admins can delete tickets
    if (!user?.role.includes("admin")) {
      throw new Error("Only admins can delete tickets")
    }

    // Get the ticket for logging
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      select: { title: true },
    })

    if (!ticket) {
      throw new Error("Ticket not found")
    }

    // Delete the ticket
    await db.supportTicket.delete({
      where: { id },
    })

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
export async function addComment(data: AddCommentParams) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to add a comment")
    }

    const comment = await db.ticketComment.create({
      data: {
        ticketId: data.ticketId,
        userId: session.user.id,
        content: data.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    await logActivity({
      actionType: "Added Comment",
      targetType: "Ticket",
      targetId: data.ticketId,
      details: `Added comment to ticket #${data.ticketId}`,
    })

    revalidatePath(`/tickets/${data.ticketId}`)
    return comment
  } catch (error) {
    console.error("Error adding comment:", error)
    throw new Error("Failed to add comment")
  }
}

// Delete a comment
export async function deleteComment(id: number) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to delete a comment")
    }

    // Get the comment for authorization check
    const comment = await db.ticketComment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!comment) {
      throw new Error("Comment not found")
    }

    // Get user role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    // Only the comment author or admins can delete comments
    if (!user?.role.includes("admin") && comment.user.id !== session.user.id) {
      throw new Error("You don't have permission to delete this comment")
    }

    // Delete the comment
    await db.ticketComment.delete({
      where: { id },
    })

    await logActivity({
      actionType: "Deleted Comment",
      targetType: "Ticket",
      targetId: comment.ticketId,
      details: `Deleted comment from ticket #${comment.ticketId}`,
    })

    revalidatePath(`/tickets/${comment.ticketId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting comment:", error)
    throw new Error("Failed to delete comment")
  }
}

// Delete an attachment
export async function deleteAttachment(id: number) {
  try {
    const session = await getSession()
    if (!session?.user) {
      throw new Error("You must be logged in to delete an attachment")
    }

    // Get the attachment for authorization check
    const attachment = await db.ticketAttachment.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
          },
        },
        ticket: {
          select: {
            id: true,
          },
        },
        comment: {
          select: {
            ticketId: true,
            userId: true,
          },
        },
      },
    })

    if (!attachment) {
      throw new Error("Attachment not found")
    }

    // Get user role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    // Only the uploader or admins can delete attachments
    if (!user?.role.includes("admin")  && attachment.uploader.id !== session.user.id) {
      throw new Error("You don't have permission to delete this attachment")
    }

    // Delete the attachment
    await db.ticketAttachment.delete({
      where: { id },
    })

    // Determine which ticket to revalidate
    const ticketId = attachment.ticket?.id || attachment.comment?.ticketId

    if (ticketId) {
      await logActivity({
        actionType: "Deleted Attachment",
        targetType: "Ticket",
        targetId: ticketId,
        details: `Deleted attachment ${attachment.originalFilename} from ticket #${ticketId}`,
      })

      revalidatePath(`/tickets/${ticketId}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting attachment:", error)
    throw new Error("Failed to delete attachment")
  }
}

// Get ticket statistics
export async function getTicketStats() {
  try {
    // Get total tickets count
    const totalTickets = await db.supportTicket.count()

    // Get status counts
    const statusCounts = await db.supportTicket.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    })

    // Get priority counts
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
            id: true,
            username: true,
          },
        },
      },
    })

    // Get tickets created this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const ticketsThisWeek = await db.supportTicket.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    })

    // Get tickets created last week
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const ticketsLastWeek = await db.supportTicket.count({
      where: {
        createdAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo,
        },
      },
    })

    // Calculate percent change
    const percentChange =
      ticketsLastWeek > 0 ? Math.round(((ticketsThisWeek - ticketsLastWeek) / ticketsLastWeek) * 100) : 0

    // Calculate average resolution time (for resolved tickets)
    const resolvedTickets = await db.supportTicket.findMany({
      where: {
        status: "resolved",
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })

    let avgResolutionTime = 0
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, ticket) => {
        const createdAt = new Date(ticket.createdAt)
        const updatedAt = new Date(ticket.updatedAt)
        const diffInHours = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        return sum + diffInHours
      }, 0)

      avgResolutionTime = Math.round(totalHours / resolvedTickets.length)
    }

    // Get top assignees
    const topAssignees = await db.user.findMany({
      where: {
        assignedTickets: {
          some: {},
        },
      },
      select: {
        id: true,
        username: true,
        _count: {
          select: {
            assignedTickets: true,
          },
        },
      },
      orderBy: {
        assignedTickets: {
          _count: "desc",
        },
      },
      take: 5,
    })

    // Get resolved counts for each assignee
    const assigneesWithStats = await Promise.all(
      topAssignees.map(async (assignee) => {
        const resolvedCount = await db.supportTicket.count({
          where: {
            assignedToId: assignee.id,
            status: "resolved",
          },
        })

        return {
          id: assignee.id,
          username: assignee.username,
          ticketCount: assignee._count.assignedTickets,
          resolvedCount,
        }
      }),
    )

    // Format the results
    const statusStats = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    }

    const priorityStats = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }

    statusCounts.forEach((item) => {
      statusStats[item.status as keyof typeof statusStats] = item._count.id
    })

    priorityCounts.forEach((item) => {
      priorityStats[item.priority as keyof typeof priorityStats] = item._count.id
    })

    return {
      totalTickets,
      ticketsThisWeek,
      ticketsLastWeek,
      percentChange,
      avgResolutionTime,
      topAssignees: assigneesWithStats,
      total: recentTickets.length,
      byStatus: statusStats,
      byPriority: priorityStats,
      recentTickets,
    }
  } catch (error) {
    console.error("Error fetching ticket stats:", error)
    // Return a valid empty structure to prevent UI errors
    return {
      totalTickets: 0,
      ticketsThisWeek: 0,
      ticketsLastWeek: 0,
      percentChange: 0,
      avgResolutionTime: 0,
      topAssignees: [],
      total: 0,
      byStatus: {
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      recentTickets: [],
    }
  }
}

// Get all users for assignment
export async function getAssignableUsers() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
      orderBy: {
        username: "asc",
      },
    })

    return users
  } catch (error) {
    console.error("Error fetching assignable users:", error)
    throw new Error("Failed to fetch users")
  }
}

