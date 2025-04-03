"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Get all projects
export async function getAllProjects(search = "") {
  try {
    const where = {
      name: {
        contains: search,
        mode: "insensitive" as const,
      },
    }

    const projects = await db.project.findMany({
      where,
      include: {
        projectType: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createDate: "desc",
      },
    })

    return projects
  } catch (error) {
    console.error("Error fetching projects:", error)
    throw new Error("Failed to fetch projects")
  }
}

// Get all project types
export async function getProjectTypes() {
  try {
    const projectTypes = await db.projectType.findMany({
      orderBy: {
        name: "asc",
      },
    })
    return projectTypes
  } catch (error) {
    console.error("Error fetching project types:", error)
    throw new Error("Failed to fetch project types")
  }
}

// Assign project type to a project
export async function assignProjectType(projectId: number, projectTypeId: number) {
  try {
    await db.project.update({
      where: { id: projectId },
      data: { projectTypeId },
    })
    revalidatePath("/projects")
  } catch (error) {
    console.error("Error assigning project type:", error)
    throw new Error("Failed to assign project type")
  }
}

// Get project assignments
export async function getProjectAssignments(projectId: number) {
  try {
    const assignments = await db.projectAssignment.findMany({
        where: { projectId },
        select: {
          id: true,
          userId: true,
          role: true,
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      })
      
    return assignments
  } catch (error) {
    console.error("Error fetching project assignments:", error)
    throw new Error("Failed to fetch project assignments")
  }
}

// Assign a user to a project
export async function assignProjectAssignment(projectId: number, userId: number, role: string) {
  try {
    // Check if the assignment already exists
    const existingAssignment = await db.projectAssignment.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    })

    if (existingAssignment) {
        // Already assigned, just skip
        return
      }
      

    await db.projectAssignment.create({
      data: {
        userId,
        projectId,
        role,
      },
    })
    revalidatePath("/projects")
  } catch (error) {
    console.error("Error assigning user to project:", error)
    throw new Error("Failed to assign user to project")
  }
}

// Remove a user from a project
export async function removeProjectAssignment(assignmentId: number) {
  try {
    await db.projectAssignment.delete({
      where: { id: assignmentId },
    })
    revalidatePath("/projects")
  } catch (error) {
    console.error("Error removing user from project:", error)
    throw new Error("Failed to remove user from project")
  }
}

// Get all users for dropdown selection
export async function getAllUsersForPermissions() {
  try {
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

    return { users }
  } catch (error) {
    console.error("Error fetching users:", error)
    throw new Error("Failed to fetch users")
  }
}

// Create a new project
export async function createProject(data: {
  businessCode: string
  projectCode: string
  name: string
}) {
  try {
    const project = await db.project.create({
      data: {
        businessCode: data.businessCode,
        projectCode: data.projectCode,
        name: data.name,
        createDate: new Date(),
      },
    })

    revalidatePath("/projects")
    return project
  } catch (error) {
    console.error("Error creating project:", error)
    throw new Error("Failed to create project")
  }
}

export async function createModelEntry(data: {
    projectId: number
    code: string
    description: string
    createBy: string
  }) {
    try {
      const modelEntry = await db.modelEntry.create({
        data: {
          projectId: data.projectId,
          code: data.code,
          description: data.description,
          createDate: new Date(),
          createBy: data.createBy,
        },
      })
  
      revalidatePath("/projects")
      return { success: true, modelEntryId: modelEntry.id }
    } catch (error) {
      console.error("Error creating model entry:", error)
      throw new Error("Failed to create model entry")
    }
  }
  
  export async function getModelEntries(projectId: number) {
    try {
      const modelEntries = await db.modelEntry.findMany({
        where: {
          projectId: projectId,
        },
        orderBy: {
          createDate: "desc",
        },
      })
  
      return modelEntries
    } catch (error) {
      console.error("Error fetching model entries:", error)
      throw new Error("Failed to fetch model entries")
    }
  }
  // Update a model entry
export async function updateModelEntry(id: number, data: { code: string; description: string }) {
    try {
      const modelEntry = await db.modelEntry.update({
        where: { id },
        data: {
          code: data.code,
          description: data.description,
          modifyDate: new Date(),
          modifyBy: "Admin", // Replace with actual user
        },
      })
      revalidatePath("/projects")
      return { success: true, modelEntry }
    } catch (error) {
      console.error("Error updating model entry:", error)
      throw new Error("Failed to update model entry")
    }
  }
  
  // Delete a model entry
  export async function deleteModelEntry(id: number) {
    try {
      await db.modelEntry.delete({
        where: { id },
      })
      revalidatePath("/projects")
      return { success: true }
    } catch (error) {
      console.error("Error deleting model entry:", error)
      throw new Error("Failed to delete model entry")
    }
  }