"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Get all teams with their relationships
export async function getTeams() {
  try {
    const teams = await db.team.findMany({
      include: {
        leaders: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
        locations: {
          include: {
            location: true,
          },
        },
      },
      orderBy: {
        sequence: "asc",
      },
    })

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
      orderBy: {
        username: "asc",
      },
    })

    const locations = await db.location.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return { teams, users, locations }
  } catch (error) {
    console.error("Error fetching teams:", error)
    throw new Error("Failed to fetch teams")
  }
}

// Delete a team
export async function deleteTeam(teamId: number) {
  try {
    await db.team.delete({
      where: {
        id: teamId,
      },
    })

    revalidatePath("/teams")
    return { success: true }
  } catch (error) {
    console.error("Error deleting team:", error)
    throw new Error("Failed to delete team")
  }
}

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
    // Validate the form data
    const validatedData = teamSchema.parse(formData)

    // Create the team
    const team = await db.team.create({
      data: {
        name: validatedData.name,
        sequence: validatedData.sequence,
        remarks: validatedData.remarks || "",
        description: validatedData.description || null,
      },
    })

    // Create team leaders
    if (validatedData.leaders.length > 0) {
      await Promise.all(
        validatedData.leaders.map((leaderId) =>
          db.teamLeader.create({
            data: {
              teamId: team.id,
              userId: Number.parseInt(leaderId),
            },
          }),
        ),
      )
    }

    // Create team members
    if (validatedData.members.length > 0) {
      await Promise.all(
        validatedData.members.map((memberId) =>
          db.teamMember.create({
            data: {
              teamId: team.id,
              userId: Number.parseInt(memberId),
            },
          }),
        ),
      )
    }

    // Create team locations
    if (validatedData.locations.length > 0) {
      await Promise.all(
        validatedData.locations.map((locationId) =>
          db.teamLocation.create({
            data: {
              teamId: team.id,
              locationId: Number.parseInt(locationId),
            },
          }),
        ),
      )
    }

    // Revalidate the teams page
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
      error: "Failed to create team",
    }
  }
}

// Get a single team by ID
export async function getTeamById(teamId: number) {
  try {
    const team = await db.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        leaders: {
          include: {
            user: true,
          },
        },
        members: {
          include: {
            user: true,
          },
        },
        locations: {
          include: {
            location: true,
          },
        },
      },
    })

    if (!team) {
      throw new Error("Team not found")
    }

    return { team }
  } catch (error) {
    console.error("Error fetching team:", error)
    throw new Error("Failed to fetch team")
  }
}

// Update a team
export async function updateTeam(teamId: number, formData: TeamFormData) {
  try {
    // Validate the form data
    const validatedData = teamSchema.parse(formData)

    // Update the team
    await db.team.update({
      where: {
        id: teamId,
      },
      data: {
        name: validatedData.name,
        sequence: validatedData.sequence,
        remarks: validatedData.remarks || "",
        description: validatedData.description || null,
      },
    })

    // Delete existing relationships
    await db.teamLeader.deleteMany({
      where: {
        teamId: teamId,
      },
    })

    await db.teamMember.deleteMany({
      where: {
        teamId: teamId,
      },
    })

    await db.teamLocation.deleteMany({
      where: {
        teamId: teamId,
      },
    })

    // Create new team leaders
    if (validatedData.leaders.length > 0) {
      await Promise.all(
        validatedData.leaders.map((leaderId) =>
          db.teamLeader.create({
            data: {
              teamId: teamId,
              userId: Number.parseInt(leaderId),
            },
          }),
        ),
      )
    }

    // Create new team members
    if (validatedData.members.length > 0) {
      await Promise.all(
        validatedData.members.map((memberId) =>
          db.teamMember.create({
            data: {
              teamId: teamId,
              userId: Number.parseInt(memberId),
            },
          }),
        ),
      )
    }

    // Create new team locations
    if (validatedData.locations.length > 0) {
      await Promise.all(
        validatedData.locations.map((locationId) =>
          db.teamLocation.create({
            data: {
              teamId: teamId,
              locationId: Number.parseInt(locationId),
            },
          }),
        ),
      )
    }

    // Revalidate the teams page
    revalidatePath("/teams")

    return { success: true }
  } catch (error) {
    console.error("Error updating team:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error: " + error.errors.map((e) => e.message).join(", "),
      }
    }

    return {
      success: false,
      error: "Failed to update team",
    }
  }
}
