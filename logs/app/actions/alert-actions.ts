"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"
import { sendEmailWithTemplate } from "./email-template-actions"
import { cache } from "react"
import { getSession } from "@/lib/auth"

// Types for alert condition creation/update
interface AlertConditionData {
  name: string
  sourceTable: string
  fieldName: string
  comparator: string
  thresholdValue: string
  timeWindowMin?: number | null
  repeatIntervalMin?: number | null
  countThreshold?: number | null
  active?: boolean
  emailTemplateId?: number | null
}

// Create a new alert condition
export async function createAlertCondition(data: AlertConditionData) {
  try {
    const alertCondition = await db.alertCondition.create({
      data: {
        name: data.name,
        sourceTable: data.sourceTable,
        fieldName: data.fieldName,
        comparator: data.comparator,
        thresholdValue: data.thresholdValue,
        timeWindowMin: data.timeWindowMin || null,
        repeatIntervalMin: data.repeatIntervalMin || null,
        countThreshold: data.countThreshold || null,
        active: data.active !== undefined ? data.active : true,
        emailTemplateId: data.emailTemplateId || null,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Created Alert Condition",
      targetType: "AlertCondition",
      targetId: alertCondition.id,
      details: `Created alert condition: ${data.name}`,
    })

    revalidatePath("/alerts")
    return { success: true, alertCondition }
  } catch (error: any) {
    console.error("Error creating alert condition:", error)
    throw new Error(`Failed to create alert condition: ${error.message || "Unknown error"}`)
  }
}

// Update an existing alert condition
export async function updateAlertCondition(id: number, data: AlertConditionData) {
  try {
    const alertCondition = await db.alertCondition.update({
      where: { id },
      data: {
        name: data.name,
        sourceTable: data.sourceTable,
        fieldName: data.fieldName,
        comparator: data.comparator,
        thresholdValue: data.thresholdValue,
        timeWindowMin: data.timeWindowMin || null,
        repeatIntervalMin: data.repeatIntervalMin || null,
        countThreshold: data.countThreshold || null,
        active: data.active !== undefined ? data.active : true,
        emailTemplateId: data.emailTemplateId || null,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Updated Alert Condition",
      targetType: "AlertCondition",
      targetId: alertCondition.id,
      details: `Updated alert condition: ${data.name}`,
    })

    revalidatePath("/alerts")
    return { success: true, alertCondition }
  } catch (error: any) {
    console.error("Error updating alert condition:", error)
    throw new Error(`Failed to update alert condition: ${error.message || "Unknown error"}`)
  }
}

// Delete an alert condition
export async function deleteAlertCondition(id: number) {
  try {
    // Get the alert condition name before deletion
    const alertCondition = await db.alertCondition.findUnique({
      where: { id },
      select: { name: true },
    })

    // Delete all related alert events first
    await db.alertEvent.deleteMany({
      where: { conditionId: id },
    })

    // Then delete the alert condition
    await db.alertCondition.delete({
      where: { id },
    })

    // Log the activity
    await logActivity({
      actionType: "Deleted Alert Condition",
      targetType: "AlertCondition",
      targetId: id,
      details: `Deleted alert condition: ${alertCondition?.name || "Unknown"}`,
    })

    revalidatePath("/alerts")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting alert condition:", error)
    throw new Error(`Failed to delete alert condition: ${error.message || "Unknown error"}`)
  }
}

// Toggle alert condition active status
export async function toggleAlertConditionStatus(id: number, active: boolean) {
  try {
    const alertCondition = await db.alertCondition.update({
      where: { id },
      data: { active },
    })

    // Log the activity
    await logActivity({
      actionType: active ? "Activated Alert Condition" : "Deactivated Alert Condition",
      targetType: "AlertCondition",
      targetId: alertCondition.id,
      details: `${active ? "Activated" : "Deactivated"} alert condition: ${alertCondition.name}`,
    })

    revalidatePath("/alerts")
    return { success: true, alertCondition }
  } catch (error: any) {
    console.error("Error toggling alert condition status:", error)
    throw new Error(`Failed to toggle alert condition status: ${error.message || "Unknown error"}`)
  }
}

// Get all alert conditions
export async function getAlertConditions(params: { active?: boolean } = {}) {
  try {
    const where: any = {}
    if (params.active !== undefined) {
      where.active = params.active
    }

    const alertConditions = await db.alertCondition.findMany({
      where,
      include: {
        emailTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
        triggeredAlerts: {
          orderBy: {
            triggeredAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return alertConditions
  } catch (error: any) {
    console.error("Error fetching alert conditions:", error)
    throw new Error(`Failed to fetch alert conditions: ${error.message || "Unknown error"}`)
  }
}

// Get a single alert condition by ID
export async function getAlertCondition(id: number) {
  try {
    const alertCondition = await db.alertCondition.findUnique({
      where: { id },
      include: {
        emailTemplate: true,
        triggeredAlerts: {
          orderBy: {
            triggeredAt: "desc",
          },
          take: 5,
        },
      },
    })

    if (!alertCondition) {
      throw new Error("Alert condition not found")
    }

    return alertCondition
  } catch (error: any) {
    console.error("Error fetching alert condition:", error)
    throw new Error(`Failed to fetch alert condition: ${error.message || "Unknown error"}`)
  }
}

// Create a new alert event
export async function createAlertEvent(conditionId: number, notes?: string) {
  try {
    const alertEvent = await db.alertEvent.create({
      data: {
        conditionId,
        notes,
      },
      include: {
        alertCondition: {
          include: {
            emailTemplate: true,
          },
        },
      },
    })
    const message = await db.message.create({
      data:{
        content: `${alertEvent.alertCondition.name} alert activated at ${alertEvent.alertCondition.thresholdValue}`,
        groupId: 1,
        senderId: 1
      }
    })
    // Update the lastTriggeredAt time on the condition
    await db.alertCondition.update({
      where: { id: conditionId },
      data: { lastTriggeredAt: new Date() },
    })

    // Send email notification if an email template is attached
    if (alertEvent.alertCondition.emailTemplateId) {
      try {
        const emailData = {
          alertName: alertEvent.alertCondition.name,
          alertTime: alertEvent.triggeredAt.toLocaleString(),
          thresholdValue: alertEvent.alertCondition.thresholdValue,
          notes: notes || "No additional notes",
        }

        await sendEmailWithTemplate(alertEvent.alertCondition.emailTemplateId, [], emailData)
      } catch (emailError) {
        console.error("Failed to send alert email:", emailError)
      }
    }

    // Log the activity
    await logActivity({
      actionType: "Alert Triggered",
      targetType: "AlertEvent",
      targetId: alertEvent.id,
      details: `Alert triggered: ${alertEvent.alertCondition.name}`,
    })

    revalidatePath("/alerts")
    return { success: true, alertEvent }
  } catch (error: any) {
    console.error("Error creating alert event:", error)
    throw new Error(`Failed to create alert event: ${error.message || "Unknown error"}`)
  }
}

// Resolve an alert event
export async function resolveAlertEvent(id: number, notes?: string) {
  try {
    // First, get the current alert event to access its notes
    
    const currentAlert = await db.alertEvent.findUnique({
      where: { id },
      select: { notes: true },
    })

    // Prepare the updated notes
    const updatedNotes = notes
      ? currentAlert?.notes
        ? `${currentAlert.notes}\n\nResolution notes: ${notes}`
        : `Resolution notes: ${notes}`
      : currentAlert?.notes

    // Now update the alert event with the combined notes
    const alertEvent = await db.alertEvent.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        notes: updatedNotes,
      },
      include: {
        alertCondition: true,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Resolved Alert",
      targetType: "AlertEvent",
      targetId: alertEvent.id,
      details: `Resolved alert: ${alertEvent.alertCondition?.name || "Unknown"}`,
    })

    revalidatePath("/alerts")
    return { success: true, alertEvent }
  } catch (error: any) {
    console.error("Error resolving alert event:", error)
    throw new Error(`Failed to resolve alert event: ${error.message || "Unknown error"}`)
  }
}

// Get all alert events with pagination and filtering
export async function getAlertEvents(
  params: {
    resolved?: boolean
    conditionId?: number
    page?: number
    pageSize?: number
  } = {},
) {
  try {
    const { resolved, conditionId, page = 1, pageSize = 10 } = params
    const where: any = {}

    if (resolved !== undefined) {
      where.resolved = resolved
    }

    if (conditionId) {
      where.conditionId = conditionId
    }

    // Get total count for pagination
    const totalCount = await db.alertEvent.count({ where })

    // Get alert events with pagination
    const alertEvents = await db.alertEvent.findMany({
      where,
      include: {
        alertCondition: true,
      },
      orderBy: {
        triggeredAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      alertEvents,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
    }
  } catch (error: any) {
    console.error("Error fetching alert events:", error)
    throw new Error(`
  Failed
  to
  fetch
  alert
  events: $
  error.message || "Unknown error"
  ;`)
  }
}

// Get a single alert event by ID
export async function getAlertEvent(id: number) {
  try {
    const alertEvent = await db.alertEvent.findUnique({
      where: { id },
      include: {
        alertCondition: {
          include: {
            emailTemplate: true,
          },
        },
      },
    })

    if (!alertEvent) {
      throw new Error("Alert event not found")
    }

    return alertEvent
  } catch (error: any) {
    console.error("Error fetching alert event:", error)
    throw new Error(`
  Failed
  to
  fetch
  alert
  event: $
  error.message || "Unknown error"
  ;`)
  }
}

// Check if an alert should be triggered based on the condition
export async function evaluateAlertCondition(conditionId: number) {
  try {
    const condition = await db.alertCondition.findUnique({
      where: { id: conditionId },
      include: {
        triggeredAlerts: {
          orderBy: {
            triggeredAt: "desc",
          },
          take: 1,
        },
      },
    })

    if (!condition || !condition.active) {
      return { shouldTrigger: false }
    }

    // Check if we should respect the repeat interval
    if (condition.repeatIntervalMin && condition.lastTriggeredAt) {
      const lastTriggered = new Date(condition.lastTriggeredAt)
      const now = new Date()
      const minutesSinceLastTrigger = (now.getTime() - lastTriggered.getTime()) / (1000 * 60)

      if (minutesSinceLastTrigger < condition.repeatIntervalMin) {
        return { shouldTrigger: false, reason: "Repeat interval not elapsed" }
      }
    }

    // Evaluate the condition based on the source table
    let shouldTrigger = false
    let data: any = null

    if (condition.sourceTable === "system_metrics") {
      // For system metrics (like CPU temperature)
      data = await evaluateSystemMetricsCondition(condition)
      shouldTrigger = data.shouldTrigger
    } else if (condition.sourceTable === "auth") {
      // For auth logs (like failed login attempts)
      data = await evaluateAuthLogsCondition(condition)
      shouldTrigger = data.shouldTrigger
    } else if (condition.sourceTable === "logs") {
      // For general system logs
      data = await evaluateSystemLogsCondition(condition)
      shouldTrigger = data.shouldTrigger
    } else if (condition.sourceTable === "UserActivity") {
      // For general system logs
      data = await evaluateActivityLogsCondition(condition)
      shouldTrigger = data.shouldTrigger
    }

    return { shouldTrigger, data }
  } catch (error: any) {
    console.error("Error evaluating alert condition:", error)
    throw new Error(`
  Failed
  to
  evaluate
  alert
  condition: $
  error.message || "Unknown error"
  ;`)
  }
}

// Helper function to evaluate system metrics conditions
async function evaluateSystemMetricsCondition(condition: any) {
  try {
    const timeWindow = condition.timeWindowMin || 5 // Default to 5 minutes
    const startTime = new Date(Date.now() - timeWindow * 60 * 1000)

    const metrics = await db.system_metrics.findMany({
      where: {
        timestamp: { gte: startTime },
        sensor_name: condition.fieldName,
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    if (metrics.length === 0) {
      return {
        shouldTrigger: false,
        reason: "No metrics found in time window",
        violatedIds: [],
        sourceTable: "system_metrics",
      }
    }

    let violationCount = 0
    let latestViolation = null
    const violatedIds: number[] = []

    for (const metric of metrics) {
      const thresholdValue = parseFloat(condition.thresholdValue)
      const metricValue = metric.value
      let conditionMet = false

      switch (condition.comparator) {
        case ">":  conditionMet = metricValue > thresholdValue; break
        case ">=": conditionMet = metricValue >= thresholdValue; break
        case "<":  conditionMet = metricValue < thresholdValue; break
        case "<=": conditionMet = metricValue <= thresholdValue; break
        case "==": conditionMet = metricValue === thresholdValue; break
        case "!=": conditionMet = metricValue !== thresholdValue; break
      }

      if (conditionMet) {
        violationCount++
        violatedIds.push(metric.id)
        if (!latestViolation) latestViolation = metric
      }
    }

    const shouldTrigger = condition.countThreshold
      ? violationCount >= condition.countThreshold
      : violationCount > 0

    const reason = condition.countThreshold
      ? shouldTrigger
        ? `Threshold exceeded ${violationCount} times (limit: ${condition.countThreshold})`
        : `Threshold exceeded ${violationCount} times, below limit of ${condition.countThreshold}`
      : violationCount > 0
        ? `Threshold exceeded ${violationCount} times`
        : "No threshold violations"

    return {
      shouldTrigger,
      reason,
      latestViolation,
      violatedIds,
      sourceTable: "system_metrics",
    }
  } catch (error) {
    console.error("Error evaluating system metrics condition:", error)
    throw error
  }
}


async function evaluateAuthLogsCondition(condition: any) {
  try {
    const timeWindow = condition.timeWindowMin || 5
    const startTime = new Date(Date.now() - timeWindow * 60 * 1000 * 100) // extended for testing

    console.log(
      `Evaluating auth condition: ${condition.name}, field: ${condition.fieldName}, comparator: ${condition.comparator}, value: ${condition.thresholdValue}`,
    )
    console.log(`Time window: ${timeWindow} minutes, start time: ${startTime.toISOString()}`)

    const authLogs = await db.auth.findMany({
      where: {
        timestamp: { gte: startTime },
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    console.log(`Found ${authLogs.length} auth logs in time window`)

    if (authLogs.length === 0) {
      return {
        shouldTrigger: false,
        reason: "No auth logs found in time window",
        violatedIds: [],
        sourceTable: "auth",
      }
    }

    let violationCount = 0
    let latestViolation = null
    const violatedIds: number[] = []

    for (const log of authLogs) {
      let conditionMet = false

      if (condition.comparator === "contains") {
        if (log.log_entry.toLowerCase().includes(condition.thresholdValue.toLowerCase())) {
          conditionMet = true
        }
      } else if (condition.comparator === "not_contains") {
        conditionMet = !log.log_entry.toLowerCase().includes(condition.thresholdValue.toLowerCase())
      }

      if (conditionMet) {
        violationCount++
        violatedIds.push(log.id)
        if (!latestViolation) {
          latestViolation = log
        }
      }
    }

    console.log(`Found ${violationCount} violations for auth condition: ${condition.name}`)

    const shouldTrigger = condition.countThreshold
      ? violationCount >= condition.countThreshold
      : violationCount > 0

    const reason = condition.countThreshold
      ? shouldTrigger
        ? `Found ${violationCount} matching logs (limit: ${condition.countThreshold})`
        : `Found ${violationCount} matching logs, but below limit of ${condition.countThreshold}`
      : violationCount > 0
        ? `Found ${violationCount} matching logs`
        : "No matching logs found"

    return {
      shouldTrigger,
      reason,
      latestViolation,
      violatedIds,
      sourceTable: "auth",
    }
  } catch (error) {
    console.error("Error evaluating auth logs condition:", error)
    throw error
  }
}

async function evaluateActivityLogsCondition(condition: any) {
  try {
    const timeWindow = condition.timeWindowMin || 5
    const startTime = new Date(Date.now() - timeWindow * 60 * 1000 * 100) // extended window for testing

    console.log(
      `Evaluating logs condition: ${condition.name}, field: ${condition.fieldName}, comparator: ${condition.comparator}, value: "${condition.thresholdValue}"`,
    )
    console.log(`Time window: ${timeWindow} minutes, start time: ${startTime.toISOString()}`)

    const systemLogs = await db.activityLog.findMany({
      orderBy: { timestamp: "desc" },
    })

    console.log(`Found ${systemLogs.length} total logs in database`)

    if (systemLogs.length === 0) {
      return {
        shouldTrigger: false,
        reason: "No activity logs found",
        violatedIds: [],
        sourceTable: "activityLog",
      }
    }

    let violationCount = 0
    let latestViolation = null
    const violatedIds: number[] = []

    for (const log of systemLogs) {
      let conditionMet = false

      if (condition.fieldName === "action" && log.actionType) {
        const logAction = log.actionType.trim().toLowerCase()
        const value = condition.thresholdValue.trim().toLowerCase()

        if (condition.comparator === "contains") {
          conditionMet = logAction.includes(value)
        } else if (condition.comparator === "not_contains") {
          conditionMet = !logAction.includes(value)
        } else if (condition.comparator === "equals") {
          conditionMet = logAction === value
        }
      } else if (condition.fieldName === "command" && log.details) {
        const logCommand = log.details.trim().toLowerCase()
        const value = condition.thresholdValue.trim().toLowerCase()

        if (condition.comparator === "contains") {
          conditionMet = logCommand.includes(value)
        } else if (condition.comparator === "not_contains") {
          conditionMet = !logCommand.includes(value)
        } else if (condition.comparator === "equals") {
          conditionMet = logCommand === value
        }
      }

      if (conditionMet) {
        violationCount++
        violatedIds.push(log.id)
        if (!latestViolation) {
          latestViolation = log
        }
      }
    }

    const shouldTrigger = condition.countThreshold
      ? violationCount >= condition.countThreshold
      : violationCount > 0

    const reason = condition.countThreshold
      ? shouldTrigger
        ? `Found ${violationCount} matching logs (limit: ${condition.countThreshold})`
        : `Found ${violationCount} matching logs, but below limit of ${condition.countThreshold}`
      : violationCount > 0
        ? `Found ${violationCount} matching logs`
        : "No matching logs found"

    return {
      shouldTrigger,
      reason,
      latestViolation,
      violatedIds,
      sourceTable: "activityLog",
    }
  } catch (error) {
    console.error("Error evaluating activity logs condition:", error)
    throw error
  }
}



async function evaluateSystemLogsCondition(condition: any) {
  try {
    const timeWindow = condition.timeWindowMin || 5
    const startTime = new Date(Date.now() - timeWindow * 60 * 1000 * 100)

    console.log(
      `Evaluating logs condition: ${condition.name}, field: ${condition.fieldName}, comparator: ${condition.comparator}, value: "${condition.thresholdValue}"`,
    )
    console.log(`Time window: ${timeWindow} minutes, start time: ${startTime.toISOString()}`)

    const systemLogs = await db.logs.findMany({
      orderBy: { timestamp: "desc" },
    })

    console.log(`Found ${systemLogs.length} total logs in database`)

    if (systemLogs.length === 0) {
      return {
        shouldTrigger: false,
        reason: "No logs found in database",
        violatedIds: [],
        sourceTable: "logs",
      }
    }

    let violationCount = 0
    let latestViolation = null
    const violatedIds: number[] = []

    for (const log of systemLogs) {
      let conditionMet = false

      if (condition.fieldName === "cpu" || condition.fieldName === "mem") {
        const fieldName = condition.fieldName as keyof typeof log
        const fieldValue = log[fieldName]
        const threshold = parseFloat(condition.thresholdValue)

        if (typeof fieldValue === "number") {
          switch (condition.comparator) {
            case ">":
              conditionMet = fieldValue > threshold
              break
            case ">=":
              conditionMet = fieldValue >= threshold
              break
            case "<":
              conditionMet = fieldValue < threshold
              break
            case "<=":
              conditionMet = fieldValue <= threshold
              break
            case "==":
              conditionMet = fieldValue === threshold
              break
            case "!=":
              conditionMet = fieldValue !== threshold
              break
          }
        }
      } else if (condition.fieldName === "command" && log.command) {
        const command = log.command.toLowerCase().trim()
        const value = condition.thresholdValue.toLowerCase().trim()

        if (condition.comparator === "contains") {
          conditionMet = command.includes(value)
        } else if (condition.comparator === "not_contains") {
          conditionMet = !command.includes(value)
        } else if (condition.comparator === "equals") {
          conditionMet = command === value
        }
      } else if (condition.fieldName === "name" && log.name) {
        const name = log.name.toLowerCase().trim()
        const value = condition.thresholdValue.toLowerCase().trim()

        if (condition.comparator === "contains") {
          conditionMet = name.includes(value)
        } else if (condition.comparator === "not_contains") {
          conditionMet = !name.includes(value)
        } else if (condition.comparator === "equals") {
          conditionMet = name === value
        }
      }

      if (conditionMet) {
        violationCount++
        violatedIds.push(log.id)
        if (!latestViolation) {
          latestViolation = log
        }
      }
    }

    const shouldTrigger = condition.countThreshold
      ? violationCount >= condition.countThreshold
      : violationCount > 0

    const reason = condition.countThreshold
      ? shouldTrigger
        ? `Found ${violationCount} matching logs (limit: ${condition.countThreshold})`
        : `Found ${violationCount} matching logs, but below limit of ${condition.countThreshold}`
      : violationCount > 0
        ? `Found ${violationCount} matching logs`
        : "No matching logs found"

    return {
      shouldTrigger,
      reason,
      latestViolation,
      violatedIds,
      sourceTable: "logs",
    }
  } catch (error) {
    console.error("Error evaluating system logs condition:", error)
    throw error
  }
}

// Run all active alert conditions and trigger alerts if needed
export async function runAlertEvaluation() {
  try {
    // Get all active alert conditions
    const conditions = await db.alertCondition.findMany({
      where: { active: true },
    })

    const results = []

    for (const condition of conditions) {
      try {
        console.log(`Evaluating condition: ${condition.name} (ID: ${condition.id})`)
        const evaluation = await evaluateAlertCondition(condition.id)
        console.log(
          `Evaluation result for ${condition.name}: shouldTrigger=${evaluation.shouldTrigger}, reason=${evaluation.data?.reason}`,
        )

        if (evaluation.shouldTrigger) {
          const violatedIds = evaluation.data?.violatedIds || []
          const sourceTable = evaluation.data?.sourceTable || "unknown"
        
          const notes = [
            evaluation.data?.reason || "Alert condition met",
            `Table: ${sourceTable}`,
            `Violated IDs: ${violatedIds.join(", ") || "None"}`,
          ].join("\n")
          console.log(`Creating alert event for condition ${condition.name} with notes: ${notes}`)

          try {
            const alertEvent = await createAlertEvent(condition.id, notes)
            console.log(`Successfully created alert event ID: ${alertEvent.alertEvent.id}`)

            results.push({
              conditionId: condition.id,
              conditionName: condition.name,
              triggered: true,
              alertEventId: alertEvent.alertEvent.id,
              reason: notes,
            })
          } catch (createError) {
            console.error(`Error creating alert event for condition ${condition.id}:`, createError)
            results.push({
              conditionId: condition.id,
              conditionName: condition.name,
              triggered: true,
              error: createError instanceof Error ? createError.message : "Unknown error creating alert event",
              reason: notes,
            })
          }
        } else {
          results.push({
            conditionId: condition.id,
            conditionName: condition.name,
            triggered: false,
            reason: evaluation.data?.reason || "Condition not met",
          })
        }
      } catch (error) {
        console.error(`Error evaluating condition ${condition.id}:`, error)
        results.push({
          conditionId: condition.id,
          conditionName: condition.name,
          triggered: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Revalidate the alerts page to show the new events
    revalidatePath("/alerts")

    return { success: true, results }
  } catch (error: any) {
    console.error("Error running alert evaluation:", error)
    throw new Error(`Failed to run alert evaluation: ${error.message || "Unknown error"}`)
  }
}

// Bulk import alert conditions
export async function bulkImportAlertConditions(conditions: AlertConditionData[]) {
  try {
    const results = []

    for (const condition of conditions) {
      try {
        const result = await createAlertCondition(condition)
        results.push({
          success: true,
          name: condition.name,
          id: result.alertCondition.id,
        })
      } catch (error) {
        results.push({
          success: false,
          name: condition.name,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    revalidatePath("/alerts")
    return { success: true, results }
  } catch (error: any) {
    console.error("Error bulk importing alert conditions:", error)
    throw new Error(`Failed to import alert conditions: ${error.message || "Unknown error"}`)
  }
}

// Add these new functions at the end of the file

/**
 * Get the count of unresolved alert events
 */
export async function getUnresolvedAlertCount() {
  try {
    const count = await db.alertEvent.count({
      where: {
        resolved: false,
      },
    })
    return count
  } catch (error) {
    console.error("Error getting unresolved alert count:", error)
    return 0
  }
}

/**
 * Mark all alert events as resolved
 */
export async function resolveAllAlertEvents(notes = "Bulk resolved") {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

    const result = await db.alertEvent.updateMany({
      where: {
        resolved: false,
      },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        notes: notes,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Resolved All Alerts",
      targetType: "AlertEvent",
      targetId: 0,
      details: `Resolved all ${result.count} unresolved alerts`,
    })

    revalidatePath("/alerts")
    return { success: true, count: result.count }
  } catch (error) {
    console.error("Error resolving all alerts:", error)
    throw error
  }
}

/**
 * Check alert conditions in real-time
 * This function can be called from client components to check for new alerts
 */
export const checkAlertConditionsRealtime = cache(async () => {
  try {
    // Use a fetch request to the API route instead of direct evaluation
    // This ensures we benefit from Next.js caching and don't spam the database
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/alerts/check`, {
      method: "GET",
      headers: {
        "Cache-Control": "max-age=300", // Cache for 5 minutes
      },
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    })

    if (!response.ok) {
      throw new Error(`Failed to check alerts: ${response.statusText}`)
    }

    const data = await response.json()

    // Filter to get only the triggered alerts
    const triggeredAlerts = data.results?.filter((result: any) => result.triggered) || []

    // If there are triggered alerts, return them
    if (triggeredAlerts.length > 0) {
      // Get the full alert event details for each triggered alert
      const alertEvents = await Promise.all(
        triggeredAlerts.map(async (alert: any) => {
          if (alert.alertEventId) {
            return await getAlertEvent(alert.alertEventId)
          }
          return null
        }),
      )

      // Filter out any null values and return the alert events
      return alertEvents.filter(Boolean)
    }

    return []
  } catch (error) {
    console.error("Error checking alert conditions in real-time:", error)
    return []
  }
})

