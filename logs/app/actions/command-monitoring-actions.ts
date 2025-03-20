"use server"

import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"
import { sendEmailWithTemplate } from "./email-template-actions"
import { getSession } from "@/lib/auth"
// Import the toast at the top of the file
import { toast } from "sonner"

interface CommandMatch {
  logId: number
  logType: "system" | "auth"
  commandId: number
  ruleId: number
  ruleName: string
  groupId: number | null
  groupName: string | null
  command: string
  logEntry: string
  timestamp: Date
  emailTemplateId?: number | null
  emailTemplateName?: string | null
}

/**
 * Check if a log entry matches any commands in the rules database
 * and trigger notifications if matches are found
 */
export async function checkCommandMatches(logEntry: string, logId: number, logType: "system" | "auth") {
  try {
    // Get all commands from the database
    const commands = await db.command.findMany({
      include: {
        rule: {
          include: {
            group: true,
            emailTemplate: {
              select: {
                id: true,
                name: true,
                subject: true,
                body: true,
                assignedUsers: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        emailTemplate: {
          select: {
            id: true,
            name: true,
            subject: true,
            body: true,
            assignedUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Find commands that match the log entry
    const matches: CommandMatch[] = []

    for (const command of commands) {
      // Skip if command pattern is empty
      if (!command.command.trim()) continue

      // Check if the log entry contains the command pattern
      if (logEntry.includes(command.command)) {
        // Handle potentially null group
        const group = command.rule.group

        // Check if this match already exists and is not addressed
        const existingMatch = await db.commandMatch.findFirst({
          where: {
            logId,
            logType,
            commandId: command.id,
            ruleId: command.ruleId,
            addressed: false,
          },
        })

        // If match already exists, skip creating a new one
        if (existingMatch) continue

        // Create a new match record in the database
        const matchRecord = await db.commandMatch.create({
          data: {
            logId,
            logType,
            commandId: command.id,
            ruleId: command.ruleId,
            // Fix the command field by using commandText instead
            commandText: command.command, // Store the command text as a string
            logEntry,
            addressed: false,
            emailSent: false,
          },
        })

        // Get email template ID from the appropriate source
        const emailTemplateId =
          command.emailTemplateId || command.rule.emailTemplateId || (group ? group.emailTemplateId : null)

        // Get email template name from the appropriate source
        const emailTemplateName =
          command.emailTemplate?.name || command.rule.emailTemplate?.name || group?.name || null

        matches.push({
          logId,
          logType,
          commandId: command.id,
          ruleId: command.ruleId,
          ruleName: command.rule.name,
          groupId: group?.id || null,
          groupName: group?.name || null,
          command: command.command,
          logEntry,
          timestamp: new Date(),
          emailTemplateId,
          emailTemplateName,
        })
      }
    }

    // If we have matches, log them and send notifications
    if (matches.length > 0) {
      // Log the matches to the activity log
      for (const match of matches) {
        await logActivity({
          actionType: "Command Match Detected",
          targetType: "Rule",
          targetId: match.ruleId,
          details: `Log entry matched command "${match.command}" in rule "${match.ruleName}"${match.groupName ? ` (Group: ${match.groupName})` : ""}`,
        })

        // If there's an email template, send notifications
        if (match.emailTemplateId) {
          await sendCommandMatchNotification(match)

          // Update the match record to indicate email was sent
          await db.commandMatch.updateMany({
            where: {
              logId: match.logId,
              commandId: match.commandId,
              ruleId: match.ruleId,
            },
            data: {
              emailSent: true,
            },
          })
        }
      }

      // Show toast notification for each match
      matches.forEach((match) => {
        toast.warning(`Command Match Detected: "${match.command}" in rule "${match.ruleName}"`, {
          description: "Check command matches for details",
          duration: 5000,
        })
      })
    }

    return matches
  } catch (error) {
    console.error("Error checking command matches:", error)
    return []
  }
}

/**
 * Send email notifications for a command match
 */
async function sendCommandMatchNotification(match: CommandMatch) {
  try {
    if (!match.emailTemplateId) return

    // Get the email template with assigned users
    const emailTemplate = await db.emailTemplate.findUnique({
      where: { id: match.emailTemplateId },
      include: {
        assignedUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
    })

    if (!emailTemplate) return

    // Extract user IDs from assigned users
    const userIds = emailTemplate.assignedUsers.map((relation) => relation.user.id)

    if (userIds.length === 0) {
      console.log("No users assigned to email template:", emailTemplate.name)
      return
    }

    // Prepare template data
    const templateData = {
      command: match.command,
      logEntry: match.logEntry,
      ruleName: match.ruleName,
      groupName: match.groupName || "N/A",
      timestamp: new Date().toLocaleString(),
      logId: match.logId.toString(),
      logType: match.logType,
    }

    // Send the email
    const result = await sendEmailWithTemplate(match.emailTemplateId, userIds, templateData)

    if (result.success) {
      // Use results instead of recipients
      const recipientCount = result.results ? result.results.length : 0
      console.log(`Email notification sent to ${recipientCount} users for command match`)

      // Log the notification
      await logActivity({
        actionType: "Email Notification Sent",
        targetType: "EmailTemplate",
        targetId: match.emailTemplateId,
        details: `Email notification sent to ${recipientCount} users for command match in rule "${match.ruleName}"`,
      })
    } else {
      console.error("Failed to send email notification:", result.error)
    }

    return result
  } catch (error) {
    console.error("Error sending command match notification:", error)
    return { success: false, error: "Failed to send notification" }
  }
}

/**
 * Process a batch of logs to check for command matches
 */
export async function processBatchForCommandMatches(logs: any[], logType: "system" | "auth") {
  const allMatches: CommandMatch[] = []

  for (const log of logs) {
    const logEntry = logType === "system" ? log.command : log.log_entry
    if (!logEntry) continue

    const matches = await checkCommandMatches(logEntry, log.id, logType)
    allMatches.push(...matches)
  }

  return allMatches
}

/**
 * Get all command matches with pagination and filtering
 */
export async function getCommandMatches({
  addressed = null,
  ruleId = null,
  page = 1,
  pageSize = 10,
  search = "",
}: {
  addressed?: boolean | null
  ruleId?: number | null
  page?: number
  pageSize?: number
  search?: string
}) {
  try {
    // Build the where clause based on filters
    const where: any = {}

    if (addressed !== null) {
      where.addressed = addressed
    }

    if (ruleId !== null) {
      where.ruleId = ruleId
    }

    // Add search functionality
    if (search) {
      where.OR = [
        {
          commandText: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          logEntry: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          rule: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ]
    }

    // Get total count for pagination
    const totalCount = await db.commandMatch.count({ where })

    // Calculate pagination
    const skip = (page - 1) * pageSize
    const take = pageSize
    const pageCount = Math.ceil(totalCount / pageSize)

    // Get matches with related data
    const matches = await db.commandMatch.findMany({
      where,
      include: {
        rule: {
          select: {
            id: true,
            name: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        addressedByUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      skip,
      take,
    })

    return {
      matches,
      totalCount,
      pageCount,
      currentPage: page,
    }
  } catch (error) {
    console.error("Error getting command matches:", error)
    throw error
  }
}

/**
 * Mark a command match as addressed
 */
export async function markCommandMatchAsAddressed(matchId: number, notes?: string) {
  try {
    // Make sure to await cookies() to get the session
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

    const userId = session.user.id

    const updatedMatch = await db.commandMatch.update({
      where: { id: matchId },
      data: {
        addressed: true,
        addressedBy: userId,
        addressedAt: new Date(),
        notes: notes || null,
      },
      include: {
        rule: {
          select: {
            name: true,
          },
        },
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Command Match Addressed",
      targetType: "CommandMatch",
      targetId: matchId,
      details: `Marked command match for rule "${updatedMatch.rule.name}" as addressed`,
    })

    return updatedMatch
  } catch (error) {
    console.error("Error marking command match as addressed:", error)
    throw error
  }
}

/**
 * Unmark a command match as addressed (set it back to unaddressed)
 */
export async function unmarkCommandMatchAsAddressed(matchId: number) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

    const match = await db.commandMatch.findUnique({
      where: { id: matchId },
      include: {
        rule: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!match) {
      throw new Error("Command match not found")
    }

    const updatedMatch = await db.commandMatch.update({
      where: { id: matchId },
      data: {
        addressed: false,
        addressedBy: null,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Command Match Unmarked",
      targetType: "CommandMatch",
      targetId: matchId,
      details: `Unmarked command match for rule "${match.rule.name}" as addressed`,
    })

    return updatedMatch
  } catch (error) {
    console.error("Error unmarking command match:", error)
    throw error
  }
}

/**
 * Delete a command match
 */
export async function deleteCommandMatch(matchId: number) {
  try {
    const match = await db.commandMatch.findUnique({
      where: { id: matchId },
      include: {
        rule: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!match) {
      throw new Error("Command match not found")
    }

    await db.commandMatch.delete({
      where: { id: matchId },
    })

    // Log the activity
    await logActivity({
      actionType: "Command Match Deleted",
      targetType: "CommandMatch",
      targetId: matchId,
      details: `Deleted command match for rule "${match.rule.name}"`,
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting command match:", error)
    throw error
  }
}

/**
 * Get the count of unaddressed command matches
 */
export async function getUnaddressedCommandMatchCount() {
  try {
    const count = await db.commandMatch.count({
      where: {
        addressed: false,
      },
    })
    return count
  } catch (error) {
    console.error("Error getting unaddressed command match count:", error)
    return 0
  }
}

/**
 * Mark all command matches as addressed
 */
export async function markAllCommandMatchesAsAddressed() {
  try {
    // Make sure to await cookies() to get the session
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

    const userId = session.user.id

    const result = await db.commandMatch.updateMany({
      where: {
        addressed: false,
      },
      data: {
        addressed: true,
        addressedBy: userId,
        addressedAt: new Date(),
        notes: "Bulk addressed by user",
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Command Matches Addressed",
      targetType: "CommandMatch",
      targetId: 0,
      details: `Marked all ${result.count} unaddressed command matches as addressed`,
    })

    return { success: true, count: result.count }
  } catch (error) {
    console.error("Error marking all command matches as addressed:", error)
    throw error
  }
}

