"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { BidStatus } from "@/prisma/generated/main"

export async function getBids(bridgeProjectId: number) {
  try {
    const bids = await db.bidSubmission.findMany({
      where: { bridgeProjectId },
      include: {
        company: true,
      },
      orderBy: { submissionDate: "desc" },
    })

    return { bids }
  } catch (error) {
    console.error("Failed to fetch bids:", error)
    return { error: "Failed to fetch bids" }
  }
}

export async function createBid(data: {
  bridgeProjectId: number
  companyId: number
  submissionDate: Date
  bidAmount: number
  proposedSchedule?: string
  technicalDetails?: string
  status: BidStatus
  evaluationScore?: number
  evaluationNotes?: string
  attachments?: string[]
}) {
  try {
    const bid = await db.bidSubmission.create({
      data,
    })

    revalidatePath(`/crm/projects/${data.bridgeProjectId}`)
    return { bid }
  } catch (error) {
    console.error("Failed to create bid:", error)
    return { error: "Failed to create bid" }
  }
}

export async function updateBid(
  id: number,
  data: {
    status?: BidStatus
    evaluationScore?: number
    evaluationNotes?: string
  },
) {
  try {
    const bid = await db.bidSubmission.update({
      where: { id },
      data,
      include: {
        bridgeProject: true,
      },
    })

    revalidatePath(`/crm/projects/${bid.bridgeProject.projectId}`)
    return { bid }
  } catch (error) {
    console.error("Failed to update bid:", error)
    return { error: "Failed to update bid" }
  }
}
