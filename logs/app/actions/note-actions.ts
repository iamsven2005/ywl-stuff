"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
})

// Log middleware for performance monitoring
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)
  return result
})

interface GetNotesParams {
  search?: string
  page?: number
  pageSize?: number
}

export async function getNotes({ search = "", page = 1, pageSize = 10 }: GetNotesParams) {
  try {
    // Build where conditions
    const where: any = {}

    // Add search condition if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.notes.count({ where })

    // Get notes with pagination
    const notes = await prisma.notes.findMany({
      where,
      orderBy: {
        time: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      notes,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
    }
  } catch (error) {
    console.error("Error fetching notes:", error)
    throw new Error("Failed to fetch notes")
  }
}

export async function getNote(id: number) {
  try {
    const note = await prisma.notes.findUnique({
      where: { id },
    })
    return note
  } catch (error) {
    console.error("Error fetching note:", error)
    throw new Error("Failed to fetch note")
  }
}

interface NoteData {
  title: string
  description: string
}

export async function createNote(data: NoteData) {
  try {
    const note = await prisma.notes.create({
      data: {
        title: data.title,
        description: data.description,
      },
    })
    return { success: true, note }
  } catch (error) {
    console.error("Error creating note:", error)
    throw new Error("Failed to create note")
  }
}

interface UpdateNoteData extends NoteData {
  id: number
}

export async function updateNote(data: UpdateNoteData) {
  try {
    const note = await prisma.notes.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
      },
    })
    return { success: true, note }
  } catch (error) {
    console.error("Error updating note:", error)
    throw new Error("Failed to update note")
  }
}

export async function deleteNote(id: number) {
  try {
    await prisma.notes.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting note:", error)
    throw new Error("Failed to delete note")
  }
}

export async function deleteMultipleNotes(ids: number[]) {
  try {
    await prisma.notes.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting notes:", error)
    throw new Error("Failed to delete notes")
  }
}

