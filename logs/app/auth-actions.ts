"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
})

// Log middleware for performance monitoring
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})

interface GetAuthLogsParams {
  search?: string
  hosts?: string[]
  page?: number
  pageSize?: number
}

// Update the getAuthLogs function to handle device names more effectively
export async function getAuthLogs({ search = "", hosts = [], page = 1, pageSize = 10 }: GetAuthLogsParams) {
  try {
    // Build where conditions
    const where: any = {}

    // Add search condition if provided
    if (search) {
      where.OR = [{ username: { contains: search } }, { log_entry: { contains: search } }]
    }

    // Add host filter if provided
    if (hosts && hosts.length > 0) {
      // For auth logs, we need to filter by the host in the log_entry
      // This is a simplified approach - in a real app, you might want to
      // extract and store the host in a separate column for better filtering
      where.OR = [
        ...(where.OR || []),
        ...hosts.map((host: string) => ({
          log_entry: { contains: host },
        })),
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.auth.count({ where })

    // Get logs with pagination
    const logs = await prisma.auth.findMany({
      where,
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
    console.error("Error fetching auth logs:", error)
    throw new Error("Failed to fetch auth logs")
  }
}

export async function deleteAuthLog(id: number) {
  try {
    await prisma.auth.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting auth log:", error)
    throw new Error("Failed to delete auth log")
  }
}

export async function deleteMultipleAuthLogs(ids: number[]) {
  try {
    await prisma.auth.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting auth logs:", error)
    throw new Error("Failed to delete auth logs")
  }
}

// Function to delete auth logs based on time period
export async function deleteAuthLogsByTimePeriod(period: string) {
  try {
    // Calculate the cutoff date based on the period
    const now = new Date()
    let cutoffDate = new Date()

    switch (period) {
      case "1day":
        cutoffDate.setDate(now.getDate() - 1)
        break
      case "7days":
        cutoffDate.setDate(now.getDate() - 7)
        break
      case "30days":
        cutoffDate.setDate(now.getDate() - 30)
        break
      case "90days":
        cutoffDate.setDate(now.getDate() - 90)
        break
      case "all":
        // For "all", we'll use a very old date to delete everything
        cutoffDate = new Date(0)
        break
      default:
        throw new Error("Invalid time period")
    }

    // Delete auth logs older than the cutoff date
    const result = await prisma.auth.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    return {
      success: true,
      count: result.count,
      message: `Deleted ${result.count} auth logs older than ${period === "all" ? "all time" : period}`,
    }
  } catch (error) {
    console.error("Error deleting auth logs by time period:", error)
    throw new Error("Failed to delete auth logs by time period")
  }
}

