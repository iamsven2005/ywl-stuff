"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const holidayFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.date(),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
})

type HolidayFormValues = z.infer<typeof holidayFormSchema>

export async function addHoliday(data: HolidayFormValues) {
  const validatedData = holidayFormSchema.parse(data)

  const result = await db.holiday.create({
    data: {
      name: validatedData.name,
      date: validatedData.date,
      description: validatedData.description,
      isRecurring: validatedData.isRecurring,
    },
  })

  revalidatePath("/leave")

  return { success: true, holiday: result }
}

export async function updateHoliday(id: number, data: HolidayFormValues) {
  const validatedData = holidayFormSchema.parse(data)

  const result = await db.holiday.update({
    where: { id },
    data: {
      name: validatedData.name,
      date: validatedData.date,
      description: validatedData.description,
      isRecurring: validatedData.isRecurring,
    },
  })

  revalidatePath("/leave")

  return { success: true, holiday: result }
}

export async function deleteHoliday(id: number) {
  await db.holiday.delete({
    where: { id },
  })

  revalidatePath("/leave")

  return { success: true }
}

export async function getHolidays() {
  const holidays = await db.holiday.findMany({
    orderBy: {
      date: "asc",
    },
  })

  return holidays
}

export async function getHolidaysByDateRange(startDate: Date, endDate: Date) {
  const holidays = await db.holiday.findMany({
    where: {
      OR: [
        // Non-recurring holidays within the date range
        {
          isRecurring: false,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Recurring holidays (we'll filter these by month/day in the client)
        {
          isRecurring: true,
        },
      ],
    },
    orderBy: {
      date: "asc",
    },
  })

  return holidays
}

export async function getHolidayById(id: number) {
  const holiday = await db.holiday.findUnique({
    where: { id },
  })

  return holiday
}
