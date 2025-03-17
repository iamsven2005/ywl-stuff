"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"


// Log middleware for performance monitoring
db.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})

interface GetRuleGroupsParams {
  search?: string
  page?: number
  pageSize?: number
}

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
    throw new Error("Failed to fetch rule groups")
  }
}

interface RuleGroupData {
  name: string
}

export async function createRuleGroup(data: RuleGroupData) {
  try {
    const ruleGroup = await db.ruleGroup.create({
      data: {
        name: data.name,
      },
    })
    revalidatePath("/logs")
    return { success: true, ruleGroup }
  } catch (error) {
    console.error("Error creating rule group:", error)
    throw new Error("Failed to create rule group")
  }
}

interface UpdateRuleGroupData extends RuleGroupData {
  id: number
}

export async function updateRuleGroup(data: UpdateRuleGroupData) {
  try {
    const ruleGroup = await db.ruleGroup.update({
      where: { id: data.id },
      data: {
        name: data.name,
      },
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
    // First delete all rules in the group
    await db.rule.deleteMany({
      where: { groupId: id },
    })

    // Then delete the group
    await db.ruleGroup.delete({
      where: { id },
    })
    revalidatePath("/logs")
    return { success: true }
  } catch (error) {
    console.error("Error deleting rule group:", error)
    throw new Error("Failed to delete rule group")
  }
}

interface RuleData {
  name: string
  description?: string
  groupId: number
  commands: string[]
}

export async function createRule(data: RuleData) {
  try {
    const rule = await db.rule.create({
      data: {
        name: data.name,
        description: data.description || null,
        groupId: data.groupId,
        commands: {
          create: data.commands.map((cmd) => ({
            command: cmd,
          })),
        },
      },
      include: {
        commands: true,
      },
    })
    revalidatePath("/logs")
    return { success: true, rule }
  } catch (error) {
    console.error("Error creating rule:", error)
    throw new Error("Failed to create rule")
  }
}

interface UpdateRuleData {
    id: number
    name?: string // Make name optional
    description?: string
    groupId?: number
    commands?: string[]
    emailTemplateId?: number | null
    commandEmailTemplateIds?: Record<number, number | null>
  }
  

export async function updateRule(data: UpdateRuleData) {
  try {
    // First update the rule
    const rule = await db.rule.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || null,
        groupId: data.groupId,
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
        data.commands.map((cmd) =>
          db.command.create({
            data: {
              ruleId: data.id,
              command: cmd,
            },
          }),
        ),
      )
    }

    revalidatePath("/logs")
    return { success: true, rule }
  } catch (error) {
    console.error("Error updating rule:", error)
    throw new Error("Failed to update rule")
  }
}

export async function deleteRule(id: number) {
  try {
    // First delete all commands for this rule
    await db.command.deleteMany({
      where: { ruleId: id },
    })

    // Then delete the rule
    await db.rule.delete({
      where: { id },
    })
    revalidatePath("/logs")
    return { success: true }
  } catch (error) {
    console.error("Error deleting rule:", error)
    throw new Error("Failed to delete rule")
  }
}

// Function to import rule groups from Excel data
export async function importRuleGroups(data: any[]) {
  try {
    for (const row of data) {
      if (row.Type === "Group") {
        await db.ruleGroup.create({
          data: {
            name: row.Name,
          },
        })
      }
    }
    revalidatePath("/logs")
    return { success: true }
  } catch (error) {
    console.error("Error importing rule groups:", error)
    throw new Error("Failed to import rule groups")
  }
}


export async function assignEmailTemplateToUsers(emailTemplateId: number, userIds: number[]) {
    try {
      // Create or update user-template associations
      await db.userEmailTemplate.createMany({
        data: userIds.map((userId) => ({
          userId,
          emailTemplateId,
        })),
        skipDuplicates: true, // Prevent duplicate entries
      });
  
      return { success: true };
    } catch (error) {
      console.error("Error assigning email template to users:", error);
      throw new Error("Failed to assign email template");
    }
  }
  
  export async function removeEmailTemplateFromUsers(emailTemplateId: number, userIds: number[]) {
    try {
      await db.userEmailTemplate.deleteMany({
        where: {
          emailTemplateId,
          userId: { in: userIds },
        },
      });
  
      return { success: true };
    } catch (error) {
      console.error("Error removing email template from users:", error);
      throw new Error("Failed to remove email template");
    }
  }
  
  export async function getUsersAssignedToEmailTemplate(emailTemplateId: number) {
    try {
      const assignedUsers = await db.userEmailTemplate.findMany({
        where: { emailTemplateId },
        include: { user: true }, // Include full user details
      });
  
      return assignedUsers.map((relation) => relation.user);
    } catch (error) {
      console.error("Error fetching assigned users:", error);
      throw new Error("Failed to fetch users assigned to email template");
    }
  }
  