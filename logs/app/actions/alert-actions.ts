"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"
import { sendEmailWithTemplate } from "./email-template-actions"

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
    // Get the time window for the condition
    const timeWindow = condition.timeWindowMin || 5 // Default to 5 minutes if not specified
    const startTime = new Date(Date.now() - timeWindow * 60 * 1000)

    // Query the system_metrics table
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
      return { shouldTrigger: false, reason: "No metrics found in time window" }
    }

    // Check if the condition is met
    let violationCount = 0
    let latestViolation = null

    for (const metric of metrics) {
      const thresholdValue = Number.parseFloat(condition.thresholdValue)
      const metricValue = metric.value

      let conditionMet = false
      switch (condition.comparator) {
        case ">":
          conditionMet = metricValue > thresholdValue
          break
        case ">=":
          conditionMet = metricValue >= thresholdValue
          break
        case "<":
          conditionMet = metricValue < thresholdValue
          break
        case "<=":
          conditionMet = metricValue <= thresholdValue
          break
        case "==":
          conditionMet = metricValue === thresholdValue
          break
        case "!=":
          conditionMet = metricValue !== thresholdValue
          break
      }

      if (conditionMet) {
        violationCount++
        if (!latestViolation) {
          latestViolation = metric
        }
      }
    }

    // If count threshold is specified, check if we've exceeded it
    if (condition.countThreshold) {
      return {
        shouldTrigger: violationCount >= condition.countThreshold,
        reason:
          violationCount >= condition.countThreshold
            ? `
  Threshold
  exceeded
  $
  violationCount
  times (limit: ${condition.countThreshold})`
            : `
  Threshold
  exceeded
  $
  violationCount
  times, but
  below
  limit
  of
  $
  condition.countThreshold
  ;`,
        latestViolation,
      }
    }

    // Otherwise, trigger if any violation was found
    return {
      shouldTrigger: violationCount > 0,
      reason:
        violationCount > 0
          ? `
  Threshold
  exceeded
  $
  violationCount
  times`
          : "No threshold violations",
      latestViolation,
    }
  } catch (error) {
    console.error("Error evaluating system metrics condition:", error)
    throw error
  }
}

// Helper function to evaluate auth logs conditions
async function evaluateAuthLogsCondition(condition: any) {
  try {
    // Get the time window for the condition
    const timeWindow = condition.timeWindowMin || 5 // Default to 5 minutes if not specified
    const startTime = new Date(Date.now() - timeWindow * 60 * 1000)

    // Query the auth table
    const authLogs = await db.auth.findMany({
      where: {
        timestamp: { gte: startTime },
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    if (authLogs.length === 0) {
      return { shouldTrigger: false, reason: "No auth logs found in time window" }
    }

    // Check if the condition is met
    let violationCount = 0
    let latestViolation = null

    for (const log of authLogs) {
      let conditionMet = false

      // For auth logs, we typically check if the log_entry contains certain text
      if (condition.comparator === "contains") {
        conditionMet = log.log_entry.toLowerCase().includes(condition.thresholdValue.toLowerCase())
      } else if (condition.comparator === "not_contains") {
        conditionMet = !log.log_entry.toLowerCase().includes(condition.thresholdValue.toLowerCase())
      }

      if (conditionMet) {
        violationCount++
        if (!latestViolation) {
          latestViolation = log
        }
      }
    }

    // If count threshold is specified, check if we've exceeded it
    if (condition.countThreshold) {
      return {
        shouldTrigger: violationCount >= condition.countThreshold,
        reason:
          violationCount >= condition.countThreshold
            ? `
  Found
  $
  violationCount
  matching
  logs (limit: ${condition.countThreshold})`
            : `
  Found
  $
  violationCount
  matching
  logs, but
  below
  limit
  of
  $
  condition.countThreshold
  ;`,
        latestViolation,
      }
    }

    // Otherwise, trigger if any violation was found
    return {
      shouldTrigger: violationCount > 0,
      reason:
        violationCount > 0
          ? `
  Found
  $
  violationCount
  matching
  logs`
          : "No matching logs found",
      latestViolation,
    }
  } catch (error) {
    console.error("Error evaluating auth logs condition:", error)
    throw error
  }
}

// Helper function to evaluate system logs conditions
async function evaluateSystemLogsCondition(condition: any) {
  try {
    // Get the time window for the condition
    const timeWindow = condition.timeWindowMin || 5 // Default to 5 minutes if not specified
    const startTime = new Date(Date.now() - timeWindow * 60 * 1000)

    // Query the logs table
    const systemLogs = await db.logs.findMany({
      where: {
        timestamp: { gte: startTime },
      },
      orderBy: {
        timestamp: "desc",
      },
    })

    if (systemLogs.length === 0) {
      return { shouldTrigger: false, reason: "No system logs found in time window" }
    }

    // Check if the condition is met
    let violationCount = 0
    let latestViolation = null

    for (const log of systemLogs) {
      let conditionMet = false

      // For system logs, we can check various fields
      if (condition.fieldName === "cpu" || condition.fieldName === "mem") {
        // Use type assertion to tell TypeScript this is a valid key
        const fieldName = condition.fieldName as keyof typeof log
        const fieldValue = log[fieldName]
        const thresholdValue = Number.parseFloat(condition.thresholdValue)

        if (fieldValue !== null && typeof fieldValue === "number") {
          switch (condition.comparator) {
            case ">":
              conditionMet = fieldValue > thresholdValue
              break
            case ">=":
              conditionMet = fieldValue >= thresholdValue
              break
            case "<":
              conditionMet = fieldValue < thresholdValue
              break
            case "<=":
              conditionMet = fieldValue <= thresholdValue
              break
            case "==":
              conditionMet = fieldValue === thresholdValue
              break
            case "!=":
              conditionMet = fieldValue !== thresholdValue
              break
          }
        }
      } else if (condition.fieldName === "command") {
        // Check if command contains the threshold value
        if (log.command && condition.comparator === "contains") {
          conditionMet = log.command.toLowerCase().includes(condition.thresholdValue.toLowerCase())
        } else if (log.command && condition.comparator === "not_contains") {
          conditionMet = !log.command.toLowerCase().includes(condition.thresholdValue.toLowerCase())
        }
      } else if (condition.fieldName === "name") {
        // Check if name contains the threshold value
        if (condition.comparator === "contains") {
          conditionMet = log.name.toLowerCase().includes(condition.thresholdValue.toLowerCase())
        } else if (condition.comparator === "not_contains") {
          conditionMet = !log.name.toLowerCase().includes(condition.thresholdValue.toLowerCase())
        } else if (condition.comparator === "equals") {
          conditionMet = log.name.toLowerCase() === condition.thresholdValue.toLowerCase()
        }
      }

      if (conditionMet) {
        violationCount++
        if (!latestViolation) {
          latestViolation = log
        }
      }
    }

    // If count threshold is specified, check if we've exceeded it
    if (condition.countThreshold) {
      return {
        shouldTrigger: violationCount >= condition.countThreshold,
        reason:
          violationCount >= condition.countThreshold
            ? `Found ${violationCount} matching logs (limit: ${condition.countThreshold})`
            : `Found ${violationCount} matching logs, but below limit of ${condition.countThreshold}`,
        latestViolation,
      }
    }

    // Otherwise, trigger if any violation was found
    return {
      shouldTrigger: violationCount > 0,
      reason: violationCount > 0 ? `Found ${violationCount} matching logs` : "No matching logs found",
      latestViolation,
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
        const evaluation = await evaluateAlertCondition(condition.id)

        if (evaluation.shouldTrigger) {
          // Create an alert event
          const notes = evaluation.data?.reason || "Alert condition met"
          const alertEvent = await createAlertEvent(condition.id, notes)

          results.push({
            conditionId: condition.id,
            conditionName: condition.name,
            triggered: true,
            alertEventId: alertEvent.alertEvent.id,
            reason: notes,
          })
        } else {
          results.push({
            conditionId: condition.id,
            conditionName: condition.name,
            triggered: false,
            reason: evaluation.data?.reason || "Condition not met",
          })
        }
      } catch (error) {
        console.error(
          `
  Error
  evaluating
  condition
  ${condition.id}
  :`,
          error,
        )
        results.push({
          conditionId: condition.id,
          conditionName: condition.name,
          triggered: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return { success: true, results }
  } catch (error: any) {
    console.error("Error running alert evaluation:", error)
    throw new Error(`Failed to run alert evaluation: ${error.message || "Unknown error"}`)
  }
}

