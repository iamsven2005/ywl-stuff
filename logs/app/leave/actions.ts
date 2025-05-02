"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentUser } from "../login/actions"
import { notFound, redirect } from "next/navigation"
import { checkUserPermission } from "../actions/permission-actions"

const leaveFormSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  leaveType: z.enum(["FULL_DAY", "AM", "PM"]),
  reason: z.string().min(5),
  approverId: z.number(),
})

type LeaveFormValues = z.infer<typeof leaveFormSchema>

export async function submitLeaveApplication(data: LeaveFormValues) {
  const validatedData = leaveFormSchema.parse(data)
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
  }
  const perm = await checkUserPermission(currentUser.id, "/leave")
  if (perm.hasPermission === false) {
    return notFound()
  }
  const result = await db.leave.create({
    data: {
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      leaveType: validatedData.leaveType,
      reason: validatedData.reason,
      status: "PENDING",
      user: { connect: { id: currentUser.id } },
      approver: { connect: { id: validatedData.approverId } },
    },
  })

  revalidatePath("/leave")
  revalidatePath("/leave/approval")

  return { success: true }
}

export async function approveLeave(leaveId: number, comment: string) {
  const result = await db.leave.update({
    where: { id: leaveId },
    data: {
      status: "APPROVED",
      approverComment: comment,
      approvedAt: new Date(),
    },
  })

  revalidatePath("/leave")
  revalidatePath("/leave/approval")

  return { success: true }
}

export async function rejectLeave(leaveId: number, comment: string) {
  const result = await db.leave.update({
    where: { id: leaveId },
    data: {
      status: "REJECTED",
      approverComment: comment,
      rejectedAt: new Date(),
    },
  })

  revalidatePath("/leave")
  revalidatePath("/leave/approval")

  return { success: true }
}

export async function getLeavesByDateRange(startDate: Date, endDate: Date) {
  const leaves = await db.leave.findMany({
    where: {
      status: "APPROVED",
      OR: [
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          AND: [{ startDate: { lte: startDate } }, { endDate: { gte: endDate } }],
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  })

  return leaves
}

// Add a function to get pending leave requests
export async function getPendingLeaves() {
  const pendingLeaves = await db.leave.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return pendingLeaves
}

// Add a function to get all approved leaves
export async function getApprovedLeaves() {
  const approvedLeaves = await db.leave.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  })

  return approvedLeaves
}
