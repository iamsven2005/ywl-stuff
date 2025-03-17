"use server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"

type ActivityLogParams = {
  actionType: string
  targetType: string
  targetId?: number
  details?: string
}

export async function logActivity({ actionType, targetType, targetId, details }: ActivityLogParams) {
  try {
    // Get the current user ID from cookies
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      console.warn("Cannot log activity: No user is logged in")
      return null
    }

    // Create activity log entry
    const activityLog = await db.activityLog.create({
      data: {
        userId: Number.parseInt(userId),
        actionType,
        targetType,
        targetId,
        details,
      },
    })

    return activityLog
  } catch (error) {
    console.error("Error logging activity:", error)
    return null
  }
}

export async function getActivityLogs({
  userId,
  actionType,
  targetType,
  dateRange,
  page = 1,
  pageSize = 10,
}: {
  userId?: number
  actionType?: string
  targetType?: string
  dateRange?: string
  page?: number
  pageSize?: number
}) {
  try {
    // Build where conditions
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (actionType) {
      where.actionType = actionType
    }

    if (targetType) {
      where.targetType = targetType
    }

    // Add date range filter
    if (dateRange) {
      const now = new Date()
      let startDate: Date | null = null

      switch (dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case "week":
          startDate = new Date(now)
          startDate.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
          startDate.setHours(0, 0, 0, 0)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1) // Start of month
          break
      }

      if (startDate) {
        where.timestamp = {
          gte: startDate,
        }
      }
    }

    // Get total count for pagination
    const totalCount = await db.activityLog.count({ where })

    // Get activity logs with pagination
    const logs = await db.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      logs,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
    }
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    throw new Error("Failed to fetch activity logs")
  }
}

export async function getCurrentUserActivityLogs({
  actionType,
  targetType,
  dateRange,
  page = 1,
  pageSize = 10,
}: {
  actionType?: string
  targetType?: string
  dateRange?: string
  page?: number
  pageSize?: number
}) {
  try {
    // Get the current user ID from cookies
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      throw new Error("No user is logged in")
    }

    return getActivityLogs({
      userId: Number.parseInt(userId),
      actionType,
      targetType,
      dateRange,
      page,
      pageSize,
    })
  } catch (error) {
    console.error("Error fetching current user activity logs:", error)
    throw new Error("Failed to fetch activity logs")
  }
}

export async function getAllActivityTypes() {
  try {
    const actionTypes = await db.activityLog.findMany({
      select: {
        actionType: true,
      },
      distinct: ["actionType"],
      orderBy: {
        actionType: "asc",
      },
    })

    return actionTypes.map((type) => type.actionType)
  } catch (error) {
    console.error("Error fetching activity types:", error)
    return []
  }
}

export async function getAllTargetTypes() {
  try {
    const targetTypes = await db.activityLog.findMany({
      select: {
        targetType: true,
      },
      distinct: ["targetType"],
      orderBy: {
        targetType: "asc",
      },
    })

    return targetTypes.map((type) => type.targetType)
  } catch (error) {
    console.error("Error fetching target types:", error)
    return []
  }
}

