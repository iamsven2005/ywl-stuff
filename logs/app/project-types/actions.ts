"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function getAllProjectTypes(search = "") {
  try {
    const where = search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}

    const projectTypes = await db.projectType.findMany({
      where,
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    })

    return projectTypes
  } catch (error) {
    console.error("Error fetching project types:", error)
    throw new Error("Failed to fetch project types")
  }
}

export async function createProjectType(data: { name: string; description: string }) {
  try {
    await db.projectType.create({
      data: {
        name: data.name,
        description: data.description || null,
      },
    })

    revalidatePath("/project-types")
    revalidatePath("/projects")
  } catch (error) {
    console.error("Error creating project type:", error)
    throw new Error("Failed to create project type")
  }
}

export async function updateProjectType(id: number, data: { name: string; description: string }) {
  try {
    await db.projectType.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
      },
    })

    revalidatePath("/project-types")
    revalidatePath("/projects")
  } catch (error) {
    console.error("Error updating project type:", error)
    throw new Error("Failed to update project type")
  }
}

export async function deleteProjectType(id: number) {
  try {
    await db.projectType.delete({
      where: { id },
    })

    revalidatePath("/project-types")
    revalidatePath("/projects")
  } catch (error) {
    console.error("Error deleting project type:", error)
    throw new Error("Failed to delete project type")
  }
}

