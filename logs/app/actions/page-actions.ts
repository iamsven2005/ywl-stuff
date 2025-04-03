"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

export async function getPages(filter?: string) {
  try {
    const where: Prisma.pagesWhereInput = filter
      ? {
          notes: {
            contains: filter,
            mode: "insensitive" as Prisma.QueryMode,
          },
        }
      : {}

    const pages = await db.pages.findMany({
      where,
      orderBy: {
        id: "asc",
      },
    })

    return { pages }
  } catch (error) {
    console.error("Error fetching pages:", error)
    return { error: "Failed to fetch pages" }
  }
}

export async function getPageById(id: number) {
  try {
    const page = await db.pages.findUnique({
      where: { id },
    })

    if (!page) {
      return { error: "Page not found" }
    }

    return { page }
  } catch (error) {
    console.error(`Error fetching page ${id}:`, error)
    return { error: "Failed to fetch page" }
  }
}

export async function updatePageNotes(id: number, notes: string) {
  try {
    await db.pages.update({
      where: { id },
      data: { notes },
    })

    revalidatePath("/page-browser")
    return { success: true }
  } catch (error) {
    console.error(`Error updating page ${id}:`, error)
    return { error: "Failed to update page notes" }
  }
}

