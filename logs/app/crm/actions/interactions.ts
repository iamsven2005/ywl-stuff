"use server"

import { revalidatePath } from "next/cache"
import {db} from "@/lib/db"

export async function getInteractions(filter?: { projectId?: number; companyId?: number }) {
  try {
    const where = {
      ...(filter?.projectId ? { projectId: filter.projectId } : {}),
      ...(filter?.companyId ? { companyId: filter.companyId } : {}),
    }

    const interactions = await db.cRMInteraction.findMany({
      where,
      include: {
        company: true,
        contact: true,
        project: true,
      },
      orderBy: { interactionDate: "desc" },
    })

    return { interactions }
  } catch (error) {
    console.error("Failed to fetch interactions:", error)
    return { error: "Failed to fetch interactions" }
  }
}

export async function createInteraction(data: {
  title: string
  notes?: string
  interactionType: string
  interactionDate: Date
  outcome?: string
  followUpRequired: boolean
  followUpDate?: Date
  contactId?: number
  companyId?: number
  projectId?: number
}) {
  try {
    const interaction = await db.cRMInteraction.create({
      data,
    })

    if (data.projectId) {
      revalidatePath(`/crm/projects/${data.projectId}`)
    }
    if (data.companyId) {
      revalidatePath(`/crm/companies/${data.companyId}`)
    }
    revalidatePath("/crm/interactions")
    return { interaction }
  } catch (error) {
    console.error("Failed to create interaction:", error)
    return { error: "Failed to create interaction" }
  }
}
