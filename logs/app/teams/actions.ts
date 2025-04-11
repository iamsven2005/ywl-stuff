"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Define the form schema
const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  sequence: z.coerce.number().int().positive("Sequence must be a positive number"),
  remarks: z.string().optional(),
  description: z.string().optional(),
  leaders: z.array(z.string()).min(1, "At least one leader is required"),
  members: z.array(z.string()),
  locations: z.array(z.string()).min(1, "At least one location is required"),
})

type TeamFormData = z.infer<typeof teamSchema>

export async function createTeam(formData: TeamFormData) {
    try {
      const validatedData = teamSchema.parse(formData)
  
      // Convert to numbers and validate foreign keys
      const leaderIds = validatedData.leaders.map((id) => parseInt(id, 10))
      const memberIds = validatedData.members.map((id) => parseInt(id, 10))
      const locationIds = validatedData.locations.map((id) => parseInt(id, 10))
  
      // Validate user existence
      const users = await db.user.findMany({
        where: { id: { in: [...leaderIds, ...memberIds] } },
        select: { id: true },
      })
      const foundUserIds = users.map((u) => u.id)
      const allUserIds = [...new Set([...leaderIds, ...memberIds])]
      for (const id of allUserIds) {
        if (!foundUserIds.includes(id)) throw new Error(`Invalid user ID: ${id}`)
      }
  
      // Validate location existence
      const locations = await db.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true },
      })
      const foundLocationIds = locations.map((l) => l.id)
      for (const id of locationIds) {
        if (!foundLocationIds.includes(id)) throw new Error(`Invalid location ID: ${id}`)
      }
  
      // Atomic transaction
      await db.$transaction(async (tx) => {
        const team = await tx.team.create({
          data: {
            name: validatedData.name,
            sequence: validatedData.sequence,
            remarks: validatedData.remarks || "",
            description: validatedData.description || null,
          },
        })
  
        await Promise.all(
          leaderIds.map((userId) =>
            tx.teamLeader.create({
              data: { teamId: team.id, userId },
            })
          )
        )
  
        await Promise.all(
          memberIds.map((userId) =>
            tx.teamMember.create({
              data: { teamId: team.id, userId },
            })
          )
        )
  
        await Promise.all(
          locationIds.map((locationId) =>
            tx.teamLocation.create({
              data: { teamId: team.id, locationId },
            })
          )
        )
      })
  
      revalidatePath("/teams")
      return { success: true }
  
    } catch (error) {
      console.error("Error creating team:", error)
  
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: "Validation error: " + error.errors.map((e) => e.message).join(", "),
        }
      }
  
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create team",
      }
    }
  }