"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"

interface GetRuleGroupsParams {
  search?: string
  page?: number
  pageSize?: number
}

// Update the getRuleGroups function to include email templates
export async function getRuleGroups({ search = "", page = 1, pageSize = 10 }: GetRuleGroupsParams) {
  try {
    // Build where conditions
    const where: any = {}

    // Add search condition if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        {
          rules: {
            some: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                {
                  commands: {
                    some: {
                      command: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              ],
            },
          },
        },
      ]
    }

    // Get total count for pagination
    const totalCount = await db.ruleGroup.count({ where })

    // Get rule groups with pagination
    const ruleGroups = await db.ruleGroup.findMany({
      where,
      include: {
        rules: {
          include: {
            commands: true,
            emailTemplate: {
              select: {
                id: true,
                name: true,
                subject: true,
              },
            },
          },
        },
        emailTemplate: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      ruleGroups,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
    }
  } catch (error) {
    console.error("Error fetching rule groups:", error)
    return null
  }
}

export async function getRuleGroup(id: number) {
  try {
    const ruleGroup = await db.ruleGroup.findUnique({
      where: { id },
      include: {
        rules: {
          include: {
            commands: true,
          },
        },
      },
    })
    return ruleGroup
  } catch (error) {
    console.error("Error fetching rule group:", error)
    throw new Error("Failed to fetch rule group")
  }
}

// Update the createRuleGroup function to include emailTemplateId
interface RuleGroupData {
  name: string
  emailTemplateId?: number | null
}

export async function createRuleGroup(data: RuleGroupData) {
  try {
    const ruleGroup = await db.ruleGroup.create({
      data: {
        name: data.name,
        emailTemplateId: data.emailTemplateId || null,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Created Rule Group",
      targetType: "RuleGroup",
      targetId: ruleGroup.id,
      details: `Created rule group: ${data.name}`,
    })

    revalidatePath("/logs")
    return { success: true, ruleGroup }
  } catch (error) {
    console.error("Error creating rule group:", error)
    throw new Error("Failed to create rule group")
  }
}

// Update the updateRuleGroup function to include emailTemplateId
interface UpdateRuleGroupData extends RuleGroupData {
  id: number
}

export async function updateRuleGroup(data: UpdateRuleGroupData) {
  try {
    const ruleGroup = await db.ruleGroup.update({
      where: { id: data.id },
      data: {
        name: data.name,
        emailTemplateId: data.emailTemplateId,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Updated Rule Group",
      targetType: "RuleGroup",
      targetId: ruleGroup.id,
      details: `Updated rule group: ${data.name}`,
    })

    revalidatePath("/logs")
    return { success: true, ruleGroup }
  } catch (error) {
    console.error("Error updating rule group:", error)
    throw new Error("Failed to update rule group")
  }
}

export async function deleteRuleGroup(id: number) {
  try {
    // Get the rule group name before deletion
    const ruleGroup = await db.ruleGroup.findUnique({
      where: { id },
      select: { name: true },
    })

    // First delete all rules in the group
    await db.rule.deleteMany({
      where: { groupId: id },
    })

    // Then delete the group
    await db.ruleGroup.delete({
      where: { id },
    })

    // Log the activity
    await logActivity({
      actionType: "Deleted Rule Group",
      targetType: "RuleGroup",
      targetId: id,
      details: `Deleted rule group: ${ruleGroup?.name || "Unknown"}`,
    })

    revalidatePath("/logs")
    return { success: true }
  } catch (error) {
    console.error("Error deleting rule group:", error)
    throw new Error("Failed to delete rule group")
  }
}

// Update the RuleData interface to include emailTemplateId
interface RuleData {
  name: string
  description?: string
  groupId: number
  commands: string[]
  emailTemplateId?: number | null
  commandEmailTemplateIds?: Record<number, number | null>
}

// Update the createRule function to include emailTemplateId
export async function createRule(data: RuleData) {
  try {
    const rule = await db.rule.create({
      data: {
        name: data.name,
        description: data.description || null,
        groupId: data.groupId,
        emailTemplateId: data.emailTemplateId || null,
        commands: {
          create: data.commands.map((cmd, index) => ({
            command: cmd,
            emailTemplateId: data.commandEmailTemplateIds?.[index] || null,
          })),
        },
      },
      include: {
        commands: true,
        group: true,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Created Rule",
      targetType: "Rule",
      targetId: rule.id,
      details: `Created rule: ${data.name} in group: ${rule.group?.name || "Unknown"}`,
    })

    revalidatePath("/logs")
    return { success: true, rule }
  } catch (error) {
    console.error("Error creating rule:", error)
    throw new Error("Failed to create rule")
  }
}

// Update the UpdateRuleData interface to include emailTemplateId
interface UpdateRuleData {
  id: number
  name: string
  description?: string
  groupId?: number
  commands?: string[]
  emailTemplateId?: number | null
  commandEmailTemplateIds?: Record<number, number | null>
}

// Update the updateRule function to include emailTemplateId
export async function updateRule(data: UpdateRuleData) {
  try {
    // First update the rule
    const rule = await db.rule.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || null,
        groupId: data.groupId,
        emailTemplateId: data.emailTemplateId,
      },
      include: {
        group: true,
      },
    })

    // If commands are provided, update them
    if (data.commands) {
      // Delete existing commands
      await db.command.deleteMany({
        where: { ruleId: data.id },
      })

      // Create new commands
      await Promise.all(
        data.commands.map((cmd, index) =>
          db.command.create({
            data: {
              ruleId: data.id,
              command: cmd,
              emailTemplateId: data.commandEmailTemplateIds?.[index] || null,
            },
          }),
        ),
      )
    }

    // Log the activity
    await logActivity({
      actionType: "Updated Rule",
      targetType: "Rule",
      targetId: rule.id,
      details: `Updated rule: ${data.name} in group: ${rule.group?.name || "Unknown"}`,
    })

    revalidatePath("/logs")
    return { success: true, rule }
  } catch (error) {
    console.error("Error updating rule:", error)
    throw new Error("Failed to update rule")
  }
}

export async function deleteRule(id: number) {
  try {
    // Get the rule details before deletion
    const rule = await db.rule.findUnique({
      where: { id },
      include: {
        group: true,
      },
    })

    // First delete all commands for this rule
    await db.command.deleteMany({
      where: { ruleId: id },
    })

    // Then delete the rule
    await db.rule.delete({
      where: { id },
    })

    // Log the activity
    await logActivity({
      actionType: "Deleted Rule",
      targetType: "Rule",
      targetId: id,
      details: `Deleted rule: ${rule?.name || "Unknown"} from group: ${rule?.group?.name || "Unknown"}`,
    })

    revalidatePath("/logs")
    return { success: true }
  } catch (error) {
    console.error("Error deleting rule:", error)
    throw new Error("Failed to delete rule")
  }
}

// Function to prepare rule groups for export
export async function prepareRuleGroupsForExport(ruleGroups: any[]) {
  const exportData: any[] = []

  ruleGroups.forEach((group) => {
    // Add the group as a row
    exportData.push({
      Type: "Group",
      ID: group.id,
      Name: group.name,
      Description: "",
      Command: "",
      GroupID: "",
      GroupName: "",
    })

    // Add each rule as a row
    group.rules.forEach((rule: any) => {
      exportData.push({
        Type: "Rule",
        ID: rule.id,
        Name: rule.name,
        Description: rule.description || "",
        Command: "",
        GroupID: group.id,
        GroupName: group.name,
      })

      // Add each command as a row
      rule.commands.forEach((cmd: any) => {
        exportData.push({
          Type: "Command",
          ID: cmd.id,
          Name: "",
          Description: "",
          Command: cmd.command,
          GroupID: group.id,
          GroupName: group.name,
          RuleID: rule.id,
          RuleName: rule.name,
        })
      })
    })
  })

  return exportData
}

// Function to import rule groups from Excel data
export async function importRuleGroups(data: any[]) {
  try {
    const groups = new Map()
    const rules = new Map()

    // First pass: Create groups and rules
    for (const row of data) {
      if (row.Type === "Group") {
        // Create group if it doesn't exist
        if (!groups.has(row.Name)) {
          const group = await db.ruleGroup.create({
            data: {
              name: row.Name,
            },
          })
          groups.set(row.Name, group.id)

          // Log the activity
          await logActivity({
            actionType: "Imported Rule Group",
            targetType: "RuleGroup",
            targetId: group.id,
            details: `Imported rule group: ${row.Name}`,
          })
        }
      } else if (row.Type === "Rule") {
        // Get or create the group
        let groupId = groups.get(row.GroupName)
        if (!groupId && row.GroupName) {
          const group = await db.ruleGroup.create({
            data: {
              name: row.GroupName,
            },
          })
          groupId = group.id
          groups.set(row.GroupName, groupId)

          // Log the activity
          await logActivity({
            actionType: "Imported Rule Group",
            targetType: "RuleGroup",
            targetId: group.id,
            details: `Imported rule group: ${row.GroupName}`,
          })
        }

        // Create the rule
        if (groupId && !rules.has(row.Name)) {
          const rule = await db.rule.create({
            data: {
              name: row.Name,
              description: row.Description || null,
              groupId: groupId,
            },
          })
          rules.set(row.Name, rule.id)

          // Log the activity
          await logActivity({
            actionType: "Imported Rule",
            targetType: "Rule",
            targetId: rule.id,
            details: `Imported rule: ${row.Name} in group: ${row.GroupName}`,
          })
        }
      }
    }

    // Second pass: Create commands
    for (const row of data) {
      if (row.Type === "Command" && row.Command) {
        const ruleId = rules.get(row.RuleName)
        if (ruleId) {
          await db.command.create({
            data: {
              ruleId: ruleId,
              command: row.Command,
            },
          })
        }
      }
    }

    revalidatePath("/logs")
    return { success: true }
  } catch (error) {
    console.error("Error importing rule groups:", error)
    throw new Error("Failed to import rule groups")
  }
}

// Add a function to get all rule groups and rules for filtering
export async function getAllRuleGroupsAndRules() {
  try {
    const ruleGroups = await db.ruleGroup.findMany({
      include: {
        rules: {
          include: {
            commands: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return ruleGroups
  } catch (error) {
    console.error("Error fetching all rule groups and rules:", error)
    return null
  }
}

// Add a function to search logs by command patterns from rules
export async function searchLogsByRuleCommands(ruleIds: number[]) {
  try {
    // Get all commands from the specified rules
    const rules = await db.rule.findMany({
      where: {
        id: {
          in: ruleIds,
        },
      },
      include: {
        commands: true,
      },
    })

    // Extract command patterns
    const commandPatterns = rules.flatMap((rule) => rule.commands.map((cmd) => cmd.command))

    return commandPatterns
  } catch (error) {
    console.error("Error searching logs by rule commands:", error)
    throw new Error("Failed to search logs by rule commands")
  }
}

