"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"

// Log middleware for performance monitoring
db.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})

interface GetAuthLogsParams {
  search?: string
  hosts?: string[]
  ruleGroups?: string[] // Added rule groups filter
  rules?: string[] // Added rules filter
  page?: number
  pageSize?: number
}

// Update the getAuthLogs function to handle rule groups and rules
export async function getAuthLogs({
  search = "",
  hosts = [],
  ruleGroups = [],
  rules = [],
  page = 1,
  pageSize = 10,
}: GetAuthLogsParams) {
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
      where.OR = [
        ...(where.OR || []),
        ...hosts.map((host: string) => ({
          log_entry: { contains: host },
        })),
      ]
    }

    // Add rule group and rule filtering
    const commandsFromRules: string[] = []

    if ((ruleGroups && ruleGroups.length > 0) || (rules && rules.length > 0)) {
      // Fetch commands from selected rule groups and rules
      const ruleGroupsData = await db.ruleGroup.findMany({
        where: {
          id: ruleGroups.length > 0 ? { in: ruleGroups.map(Number) } : undefined,
        },
        include: {
          rules: {
            where: {
              id: rules.length > 0 ? { in: rules.map(Number) } : undefined,
            },
            include: {
              commands: true,
            },
          },
        },
      })

      // Extract all commands from the rule groups and rules
      ruleGroupsData.forEach((group) => {
        group.rules.forEach((rule) => {
          rule.commands.forEach((cmd) => {
            commandsFromRules.push(cmd.command)
          })
        })
      })

      // If we have commands from rules, add them to the where condition
      if (commandsFromRules.length > 0) {
        where.OR = [
          ...(where.OR || []),
          ...commandsFromRules.map((cmd) => ({
            log_entry: { contains: cmd },
          })),
        ]
      }
    }

    // Get total count for pagination
    const totalCount = await db.auth.count({ where })

    // Get logs with pagination
    const logs = await db.auth.findMany({
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
      matchedCommands: commandsFromRules,
    }
  } catch (error) {
    console.error("Error fetching auth logs:", error)
    throw new Error("Failed to fetch auth logs")
  }
}

export async function deleteAuthLog(id: number) {
  try {
    await db.auth.delete({
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
    await db.auth.deleteMany({
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
    const result = await db.auth.deleteMany({
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

// New function to add a command to a rule from an auth log entry
export async function addAuthLogCommandToRule(authLogId: number, ruleId: number, commandText: string) {
  try {
    // First, check if the auth log exists
    const authLog = await db.auth.findUnique({
      where: { id: authLogId },
    })

    if (!authLog) {
      throw new Error("Auth log not found")
    }

    // Check if the rule exists
    const rule = await db.rule.findUnique({
      where: { id: ruleId },
      include: { group: true },
    })

    if (!rule) {
      throw new Error("Rule not found")
    }

    // Create the command
    const command = await db.command.create({
      data: {
        ruleId,
        command: commandText,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Added Command From Auth Log",
      targetType: "Rule",
      targetId: ruleId,
      details: `Added command "${commandText}" to rule "${rule.name}" from auth log ID ${authLogId}`,
    })

    revalidatePath("/logs")
    return {
      success: true,
      command,
      message: `Command added to rule "${rule.name}" in group "${rule.group?.name || "Unknown"}"`,
    }
  } catch (error) {
    console.error("Error adding command to rule:", error)
    throw new Error(`Failed to add command to rule: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

