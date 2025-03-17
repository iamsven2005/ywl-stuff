"use server"

import { db } from "@/lib/db"
import { system_metrics } from "@prisma/client"


// Log middleware for performance monitoring
db.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})

// Update the GetLogsParams interface to include rule groups and rules
interface GetLogsParams {
  search?: string
  hosts?: string[]
  actions?: string[]
  ruleGroups?: string[]
  rules?: string[]
  cpuThreshold?: number | null
  memThreshold?: number | null
  page?: number
  pageSize?: number
}

// Update the getLogs function to include rule group and rule filtering
export async function getLogs({
  search = "",
  hosts = [],
  actions = [],
  ruleGroups = [],
  rules = [],
  cpuThreshold = null,
  memThreshold = null,
  page = 1,
  pageSize = 10,
}: GetLogsParams) {
  try {
    // Build where conditions
    const where: any = {}

    // Add search condition if provided
    if (search) {
      where.OR = [{ name: { contains: search } }, { piuser: { contains: search } }, { command: { contains: search } }]
    }

    // Add host filter if provided
    if (hosts && hosts.length > 0) {
      where.host = {
        in: hosts,
      }
    }

    // Add action filter if provided
    if (actions && actions.length > 0) {
      // Handle both action field and name field that might contain action keywords
      where.OR = [
        ...(where.OR || []),
        { action: { in: actions } },
        ...actions.map((action) => ({
          name: { contains: action },
        })),
      ]
    }

    // Add rule group filter if provided
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
            command: { contains: cmd },
          })),
        ]
      }
    }

    // Add CPU threshold filter if provided
    if (cpuThreshold !== null) {
      where.cpu = {
        gte: cpuThreshold,
      }
    }

    // Add Memory threshold filter if provided
    if (memThreshold !== null) {
      where.mem = {
        gte: memThreshold,
      }
    }

    // Get total count for pagination
    const totalCount = await db.logs.count({ where })

    // Get logs with pagination
    const logs = await db.logs.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Process logs to pair login/logout events
    const processedLogs = processLoginLogoutPairs(logs)

    return {
      logs: processedLogs,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
      matchedCommands: commandsFromRules,
    }
  } catch (error) {
    console.error("Error fetching logs:", error)
    throw new Error("Failed to fetch logs")
  }
}

// Function to process logs and pair login/logout events
function processLoginLogoutPairs(logs: any[]) {
  // Create a map to store login events by host and user
  const loginMap = new Map()

  // First pass: identify all login events and store them by host and user
  logs.forEach((log) => {
    const isLogin = log.name.toLowerCase().includes("login") || (log.action && log.action.toLowerCase() === "login")

    if (isLogin) {
      const key = `${log.host || "unknown"}-${log.piuser || "unknown"}`
      if (!loginMap.has(key)) {
        loginMap.set(key, [])
      }
      loginMap.get(key).push(log)
    }
  })

  // Second pass: for each log, check if it's a logout and find the corresponding login
  return logs.map((log) => {
    const isLogout = log.name.toLowerCase().includes("logout") || (log.action && log.action.toLowerCase() === "logout")

    // If this is a logout event
    if (isLogout) {
      const key = `${log.host || "unknown"}-${log.piuser || "unknown"}`

      if (loginMap.has(key)) {
        const logins = loginMap.get(key)

        // Find the most recent login before this logout
        const matchingLogin = logins.find((login: any) => new Date(login.timestamp) < new Date(log.timestamp))

        if (matchingLogin) {
          // Add the login time to the log entry
          return {
            ...log,
            pairedWithLogin: matchingLogin.id,
            loginTime: matchingLogin.timestamp,
          }
        }
      }
    }

    // If this is a login event, check if there's a corresponding logout
    const isLogin = log.name.toLowerCase().includes("login") || (log.action && log.action.toLowerCase() === "login")

    if (isLogin) {
      // Find a logout log for the same host and user that happened after this login
      const logoutLog = logs.find(
        (l) =>
          l.host === log.host &&
          l.piuser === log.piuser &&
          (l.name.toLowerCase().includes("logout") || (l.action && l.action.toLowerCase() === "logout")) &&
          new Date(l.timestamp) > new Date(log.timestamp),
      )

      if (logoutLog) {
        return {
          ...log,
          pairedWithLogout: logoutLog.id,
          logoutTime: logoutLog.timestamp,
        }
      }
    }

    return log
  })
}

// Function to get device usage data for the chart
export async function getDeviceUsageData(timeRange: string) {
  try {
    // Calculate the start date based on the time range
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "1h":
        startDate.setHours(now.getHours() - 1)
        break
      case "6h":
        startDate.setHours(now.getHours() - 6)
        break
      case "24h":
        startDate.setDate(now.getDate() - 1)
        break
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      default:
        startDate.setDate(now.getDate() - 1) // Default to 24h
    }

    // Get logs with CPU and memory usage within the time range
    const logs = await db.logs.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
        // Ensure we have CPU or memory data
        OR: [{ cpu: { not: null } }, { mem: { not: null } }],
      },
      orderBy: {
        timestamp: "asc",
      },
      select: {
        timestamp: true,
        host: true,
        cpu: true,
        mem: true,
      },
    })

    // Process the logs to create time series data
    // We'll group by timestamp (rounded to appropriate intervals) and host
    const timeSeriesMap = new Map()
    const interval = getIntervalFromTimeRange(timeRange)

    logs.forEach((log) => {
      if (!log.host) return // Skip logs without host

      // Round timestamp to the nearest interval
      const timestamp = roundTimestampToInterval(new Date(log.timestamp), interval)
      const key = timestamp.toISOString()

      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, { timestamp: key })
      }

      const entry = timeSeriesMap.get(key)

      // Initialize host data if not exists
      if (!entry[log.host]) {
        entry[log.host] = { cpu: null, mem: null }
      }

      // Update CPU and memory values if available
      // We'll use the latest value in the interval
      if (log.cpu !== null) {
        entry[log.host].cpu = log.cpu
      }

      if (log.mem !== null) {
        entry[log.host].mem = log.mem
      }
    })

    // Convert map to array and sort by timestamp
    const timeSeriesData = Array.from(timeSeriesMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    return {
      timeSeriesData,
    }
  } catch (error) {
    console.error("Error fetching device usage data:", error)
    throw new Error("Failed to fetch device usage data")
  }
}

// Function to get memory usage data for the chart
export async function getMemoryUsageData(timeRange: string) {
  try {
    // Calculate the start date based on the time range
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "1h":
        startDate.setHours(now.getHours() - 1)
        break
      case "6h":
        startDate.setHours(now.getHours() - 6)
        break
      case "24h":
        startDate.setDate(now.getDate() - 1)
        break
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      default:
        startDate.setDate(now.getDate() - 1) // Default to 24h
    }

    // Get memory usage data within the time range
    const memoryData = await db.memory_usage.findMany({
      where: {
        time: {
          gte: startDate,
        },
      },
      orderBy: {
        time: "asc",
      },
      select: {
        id: true,
        time: true,
        host: true,
        total_memory: true,
        used_memory: true,
        free_memory: true,
        available_memory: true,
        percent_usage: true,
      },
    })

    // Process the data to create time series data
    // We'll group by timestamp (rounded to appropriate intervals) and host
    const timeSeriesMap = new Map()
    const interval = getIntervalFromTimeRange(timeRange)

    memoryData.forEach((data) => {
      if (!data.host) return // Skip entries without host

      // Round timestamp to the nearest interval
      const timestamp = roundTimestampToInterval(new Date(data.time), interval)
      const key = timestamp.toISOString()

      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, { timestamp: key })
      }

      const entry = timeSeriesMap.get(key)

      // Initialize host data if not exists
      if (!entry[data.host]) {
        entry[data.host] = {
          total_memory: data.total_memory,
          used_memory: data.used_memory,
          free_memory: data.free_memory,
          available_memory: data.available_memory,
          percent_usage: data.percent_usage,
        }
      } else {
        // Update with the latest values in the interval
        entry[data.host] = {
          total_memory: data.total_memory,
          used_memory: data.used_memory,
          free_memory: data.free_memory,
          available_memory: data.available_memory,
          percent_usage: data.percent_usage,
        }
      }
    })

    // Convert map to array and sort by timestamp
    const timeSeriesData = Array.from(timeSeriesMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    return {
      timeSeriesData,
    }
  } catch (error) {
    console.error("Error fetching memory usage data:", error)
    throw new Error("Failed to fetch memory usage data")
  }
}

// Helper function to determine interval based on time range
function getIntervalFromTimeRange(timeRange: string): number {
  switch (timeRange) {
    case "1h":
      return 5 * 60 * 1000 // 5 minutes in milliseconds
    case "6h":
      return 15 * 60 * 1000 // 15 minutes
    case "24h":
      return 60 * 60 * 1000 // 1 hour
    case "7d":
      return 6 * 60 * 60 * 1000 // 6 hours
    default:
      return 60 * 60 * 1000 // Default to 1 hour
  }
}

// Helper function to round timestamp to nearest interval
function roundTimestampToInterval(date: Date, interval: number): Date {
  const timestamp = date.getTime()
  const rounded = Math.floor(timestamp / interval) * interval
  return new Date(rounded)
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

// Function to get sensor data for the chart - updated to include host information
export async function getSensorData(timeRange: string) {
  try {
    // Calculate the start date based on the time range
    const now = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case "1h":
        startDate.setHours(now.getHours() - 1)
        break
      case "6h":
        startDate.setHours(now.getHours() - 6)
        break
      case "24h":
        startDate.setDate(now.getDate() - 1)
        break
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      default:
        startDate.setDate(now.getDate() - 1) // Default to 24h
    }

    // Get sensor data within the time range
    const sensorData = await db.system_metrics.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
      select: {
        id: true,
        timestamp: true,
        sensor_name: true,
        value_type: true,
        value: true,
        host: true,
      },
    })

    // Process the data to create time series data
    // We'll group by timestamp and create separate series for each sensor
    const timeSeriesMap = new Map()
    const interval = getIntervalFromTimeRange(timeRange)

    sensorData.forEach((data: system_metrics) => {
      // Round timestamp to the nearest interval
      const timestamp = roundTimestampToInterval(new Date(data.timestamp), interval)
      const key = timestamp.toISOString()

      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, { timestamp: key })
      }

      const entry = timeSeriesMap.get(key)

      // Initialize or update sensor data with host information
      if (!entry[data.sensor_name]) {
        entry[data.sensor_name] = {
          value: data.value,
          type: data.value_type,
          host: data.host,
        }
      } else {
        // Update with the latest values in the interval
        entry[data.sensor_name] = {
          value: data.value,
          type: data.value_type,
          host: data.host,
        }
      }
    })

    // Convert map to array and sort by timestamp
    const timeSeriesData = Array.from(timeSeriesMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    return {
      timeSeriesData,
    }
  } catch (error) {
    console.error("Error fetching sensor data:", error)
    throw new Error("Failed to fetch sensor data")
  }
}

// Function to delete logs based on time period
export async function deleteLogsByTimePeriod(period: string) {
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

    // Delete logs older than the cutoff date
    const result = await db.logs.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    return {
      success: true,
      count: result.count,
      message: `Deleted ${result.count} logs older than ${period === "all" ? "all time" : period}`,
    }
  } catch (error) {
    console.error("Error deleting logs by time period:", error)
    throw new Error("Failed to delete logs by time period")
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

