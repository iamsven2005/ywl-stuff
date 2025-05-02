"use server"

import { db } from "@/lib/db"
import { PhaseStatus } from "@/prisma/generated/main"
import { revalidatePath } from "next/cache"


export async function getPhase(id: number) {
  try {
    const phase = await db.bridgePhase.findUnique({
      where: { id },
      include: {
        bridgeProject: true,
        inspections: true,
      },
    })

    if (!phase) {
      return { error: "Phase not found" }
    }

    return { phase }
  } catch (error) {
    console.error("Failed to fetch phase:", error)
    return { error: "Failed to fetch phase" }
  }
}

export async function createPhase(data: {
  bridgeProjectId: number
  name: string
  description?: string
  startDate?: Date
  endDate?: Date
  status: PhaseStatus
  completionPercentage: number
}) {
  try {
    const phase = await db.bridgePhase.create({
      data,
      include: {
        bridgeProject: true,
      },
    })

    const projectId = phase.bridgeProject.projectId
    revalidatePath(`/crm/projects/${projectId}`)
    return { phase }
  } catch (error) {
    console.error("Failed to create phase:", error)
    return { error: "Failed to create phase" }
  }
}

export async function updatePhase(
  id: number,
  data: {
    name?: string
    description?: string
    startDate?: Date
    endDate?: Date
    status?: PhaseStatus
    completionPercentage?: number
  },
) {
  try {
    const phase = await db.bridgePhase.update({
      where: { id },
      data,
      include: {
        bridgeProject: true,
      },
    })

    const projectId = phase.bridgeProject.projectId
    revalidatePath(`/crm/projects/${projectId}`)
    return { phase }
  } catch (error) {
    console.error("Failed to update phase:", error)
    return { error: "Failed to update phase" }
  }
}

export async function deletePhase(id: number) {
  try {
    const phase = await db.bridgePhase.findUnique({
      where: { id },
      include: {
        bridgeProject: true,
      },
    })

    if (!phase) {
      return { error: "Phase not found" }
    }

    await db.bridgePhase.delete({
      where: { id },
    })

    const projectId = phase.bridgeProject.projectId
    revalidatePath(`/crm/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to delete phase:", error)
    return { error: "Failed to delete phase" }
  }
}

export async function createInspection(data: {
  bridgePhaseId: number
  inspectionDate: Date
  inspector: string
  result: string
  notes?: string
  attachments?: string[]
}) {
  try {
    const inspection = await db.phaseInspection.create({
      data,
      include: {
        bridgePhase: {
          include: {
            bridgeProject: true,
          },
        },
      },
    })

    const projectId = inspection.bridgePhase.bridgeProject.projectId
    revalidatePath(`/crm/projects/${projectId}`)
    return { inspection }
  } catch (error) {
    console.error("Failed to create inspection:", error)
    return { error: "Failed to create inspection" }
  }
}
