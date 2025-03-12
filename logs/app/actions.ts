"use server"

import { db } from "@/lib/db"

// Log middleware for performance monitoring
db.$use(async (params: any, next: any) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})

interface GetLogsParams {
  search?: string
  hosts?: string[]
  page?: number
  pageSize?: number
}

export async function getLogs({ search = "", hosts = [], page = 1, pageSize = 50 }: GetLogsParams) {
  try {
    // Build where conditions
    const where: any = {}

    // Add search condition if provided
    if (search) {
      where.name = {
        contains: search,
      }
    }

    // Add host filter if provided
    if (hosts && hosts.length > 0) {
      where.host = {
        in: hosts,
      }
    }

    // Get logs with pagination
    const logs = await db.logs.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return logs
  } catch (error) {
    console.error("Error fetching logs:", error)
    throw new Error("Failed to fetch logs")
  }
}

export async function deleteLog(id: number) {
  try {
    await db.logs.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting log:", error)
    throw new Error("Failed to delete log")
  }
}

export async function deleteMultipleLogs(ids: number[]) {
  try {
    await db.logs.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting logs:", error)
    throw new Error("Failed to delete logs")
  }
}

