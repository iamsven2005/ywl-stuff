"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { BridgeType, ProjectStatus } from "@/prisma/generated/main"

export async function getProjects() {
  try {
    const projects = await db.project.findMany({
      include: {
        bridgeProject: true,
        projectType: true,
        _count: {
          select: {
            companies: true,
          },
        },
      },
      orderBy: { createDate: "desc" },
    })

    return { projects }
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return { error: "Failed to fetch projects" }
  }
}

export async function getProject(id: number) {
  try {
    const project = await db.project.findUnique({
      where: { id },
      include: {
        bridgeProject: {
          include: {
            phases: {
              include: {
                inspections: true,
              },
            },
            materials: {
              include: {
                orders: {
                  include: {
                    vendor: true,
                  },
                },
              },
            },
            bids: {
              include: {
                company: true,
              },
            },
          },
        },
        projectType: true,
        companies: {
          include: {
            company: true,
          },
        },
        interactions: {
          include: {
            company: true,
            contact: true,
          },
          orderBy: { interactionDate: "desc" },
        },
      },
    })

    if (!project) {
      return { error: "Project not found" }
    }

    return { project }
  } catch (error) {
    console.error("Failed to fetch project:", error)
    return { error: "Failed to fetch project" }
  }
}

export async function createProject(data: {
  businessCode: string
  projectCode: string
  name: string
  description?: string
  location?: string
  startDate?: Date
  estimatedEndDate?: Date
  budget?: number
  status?: ProjectStatus
  projectTypeId?: number
  bridgeProject?: {
    bridgeType: BridgeType
    spanLength?: number
    width?: number
    height?: number
    loadCapacity?: number
    waterway?: string
    environmentalConsiderations?: string
    trafficImpact?: string
    permitNumbers?: string[]
    designDocuments?: string[]
  }
}) {
  try {
    const { bridgeProject, ...projectData } = data

    const project = await db.project.create({
      data: {
        ...projectData,
        bridgeProject: bridgeProject
          ? {
              create: bridgeProject,
            }
          : undefined,
      },
      include: {
        bridgeProject: true,
      },
    })

    revalidatePath("/crm/projects")
    return { project }
  } catch (error) {
    console.error("Failed to create project:", error)
    return { error: "Failed to create project" }
  }
}

export async function updateProject(
  id: number,
  data: {
    businessCode?: string
    projectCode?: string
    name?: string
    description?: string
    location?: string
    startDate?: Date
    estimatedEndDate?: Date
    actualEndDate?: Date
    budget?: number
    status?: ProjectStatus
    projectTypeId?: number
    bridgeProject?: {
      bridgeType?: BridgeType
      spanLength?: number
      width?: number
      height?: number
      loadCapacity?: number
      waterway?: string
      environmentalConsiderations?: string
      trafficImpact?: string
      permitNumbers?: string[]
      designDocuments?: string[]
    }
  },
) {
  try {
    const { bridgeProject, ...projectData } = data

    const project = await db.project.update({
      where: { id },
      data: {
        ...projectData,
        bridgeProject: bridgeProject
          ? {
              upsert: {
                create: bridgeProject,
                update: bridgeProject,
              },
            }
          : undefined,
      },
      include: {
        bridgeProject: true,
      },
    })

    revalidatePath(`/crm/projects/${id}`)
    revalidatePath("/crm/projects")
    return { project }
  } catch (error) {
    console.error("Failed to update project:", error)
    return { error: "Failed to update project" }
  }
}

export async function deleteProject(id: number) {
  try {
    await db.project.delete({
      where: { id },
    })

    revalidatePath("/crm/projects")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete project:", error)
    return { error: "Failed to delete project" }
  }
}

export async function addCompanyToProject(data: {
  projectId: number
  companyId: number
  role: string
  notes?: string
  startDate?: Date
  endDate?: Date
  contractValue?: number
  contractStatus?: string
}) {
  try {
    const { projectId, companyId, ...linkData } = data

    const projectCompanyLink = await db.projectCompanyLink.create({
      data: {
        project: { connect: { id: projectId } },
        company: { connect: { id: companyId } },
        ...linkData,
      },
    })

    revalidatePath(`/crm/projects/${projectId}`)
    return { projectCompanyLink }
  } catch (error) {
    console.error("Failed to add company to project:", error)
    return { error: "Failed to add company to project" }
  }
}
