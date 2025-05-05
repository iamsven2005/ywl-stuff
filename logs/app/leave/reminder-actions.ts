"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentUser } from "../login/actions"
import { redirect } from "next/navigation"

const reminderFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date(),
  description: z.string().optional(),
  color: z.string().optional(),
})

type ReminderFormValues = z.infer<typeof reminderFormSchema>

export async function addReminder(data: ReminderFormValues) {
  const validatedData = reminderFormSchema.parse(data)
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  const result = await db.reminder.create({
    data: {
      title: validatedData.title,
      date: validatedData.date,
      description: validatedData.description,
      color: validatedData.color,
      user: { connect: { id: currentUser.id } },
    },
  })

  revalidatePath("/leave")

  return { success: true, reminder: result }
}

export async function updateReminder(id: number, data: ReminderFormValues) {
  const validatedData = reminderFormSchema.parse(data)
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  // Ensure the reminder belongs to the current user
  const reminder = await db.reminder.findFirst({
    where: {
      id,
      userId: currentUser.id,
    },
  })

  if (!reminder) {
    return { success: false, error: "Reminder not found or you don't have permission to edit it" }
  }

  const result = await db.reminder.update({
    where: { id },
    data: {
      title: validatedData.title,
      date: validatedData.date,
      description: validatedData.description,
      color: validatedData.color,
    },
  })

  revalidatePath("/leave")

  return { success: true, reminder: result }
}

export async function deleteReminder(id: number) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  // Ensure the reminder belongs to the current user
  const reminder = await db.reminder.findFirst({
    where: {
      id,
      userId: currentUser.id,
    },
  })

  if (!reminder) {
    return { success: false, error: "Reminder not found or you don't have permission to delete it" }
  }

  await db.reminder.delete({
    where: { id },
  })

  revalidatePath("/leave")

  return { success: true }
}

export async function getUserReminders() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  const reminders = await db.reminder.findMany({
    where: {
      userId: currentUser.id,
    },
    orderBy: {
      date: "asc",
    },
  })

  return reminders
}

export async function getRemindersByDateRange(startDate: Date, endDate: Date) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  const reminders = await db.reminder.findMany({
    where: {
      userId: currentUser.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  return reminders
}

export async function getReminderById(id: number) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  const reminder = await db.reminder.findFirst({
    where: {
      id,
      userId: currentUser.id,
    },
  })

  return reminder
}
