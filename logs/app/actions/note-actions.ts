"use server"

import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"

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
    const totalCount = await db.notes.count({ where })

    // Get notes with pagination
    const notes = await db.notes.findMany({
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
    return null
  }
}

export async function getNote(id: number) {
  try {
    const note = await db.notes.findUnique({
      where: { id },
    })
    return note
  } catch (error) {
    console.error("Error fetching note:", error)
    return null
  }
}

interface NoteData {
  title: string
  description: string
}

export async function createNote(data: NoteData) {
  try {
    const note = await db.notes.create({
      data: {
        title: data.title,
        description: data.description,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Created Note",
      targetType: "Note",
      targetId: note.id,
      details: `Created note: ${data.title}`,
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
    const note = await db.notes.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Updated Note",
      targetType: "Note",
      targetId: note.id,
      details: `Updated note: ${data.title}`,
    })

    return { success: true, note }
  } catch (error) {
    console.error("Error updating note:", error)
    throw new Error("Failed to update note")
  }
}

export async function deleteNote(id: number) {
  try {
    const note = await db.notes.findUnique({
      where: { id },
      select: { title: true },
    })

    await db.notes.delete({
      where: { id },
    })

    // Log the activity
    await logActivity({
      actionType: "Deleted Note",
      targetType: "Note",
      targetId: id,
      details: `Deleted note: ${note?.title || "Unknown"}`,
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting note:", error)
    throw new Error("Failed to delete note")
  }
}

export async function deleteMultipleNotes(ids: number[]) {
  try {
    // Get note titles before deletion for logging
    const notes = await db.notes.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        title: true,
      },
    })

    await db.notes.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    })

    // Log the activity for each deleted note
    for (const note of notes) {
      await logActivity({
        actionType: "Deleted Note",
        targetType: "Note",
        targetId: note.id,
        details: `Deleted note: ${note.title}`,
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting notes:", error)
    throw new Error("Failed to delete notes")
  }
}

