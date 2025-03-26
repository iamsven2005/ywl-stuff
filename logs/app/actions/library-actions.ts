"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import type { LibraryEntry, Prisma } from "@prisma/client"
import { logActivity } from "@/lib/activity-logger"

/**
 * Get all library entries with optional filtering and pagination
 */

export async function getLibraryEntries(
  page = 1,
  pageSize = 10,
  search?: string,
  category?: string,
  pubYearFrom?: number,
  pubYearTo?: number,
  creationDateFrom?: Date,
  creationDateTo?: Date,
  sortBy = "refNo",
  sortOrder: "asc" | "desc" = "asc",
  hasAttachment?: boolean,
) {
  try {
    const skip = (page - 1) * pageSize

    // Build where clause based on filters
    const where: Prisma.LibraryEntryWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { refNo: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { remarks: { contains: search, mode: "insensitive" } },
      ]
    }

    if (category && category !== "all") {
      where.category = category
    }

    if (pubYearFrom || pubYearTo) {
      where.pubYear = {}
      if (pubYearFrom) where.pubYear.gte = pubYearFrom
      if (pubYearTo) where.pubYear.lte = pubYearTo
    }

    if (creationDateFrom || creationDateTo) {
      where.creationDate = {}
      if (creationDateFrom) where.creationDate.gte = creationDateFrom
      if (creationDateTo) where.creationDate.lte = creationDateTo
    }

    if (hasAttachment !== undefined) {
      where.attachmentUrl = hasAttachment ? { not: null } : null
    }

    // Validate sortBy to prevent SQL injection
    const validSortFields = [
      "id",
      "refNo",
      "title",
      "category",
      "author",
      "pubYear",
      "creationDate",
      "borrower",
      "loanDate",
    ]

    const orderBy: Prisma.LibraryEntryOrderByWithRelationInput = {}
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy as keyof Prisma.LibraryEntryOrderByWithRelationInput] = sortOrder
    } else {
      orderBy.refNo = sortOrder // Default sort
    }

    // Get entries with pagination in a single transaction for consistency
    const [entries, total] = await db.$transaction([
      db.libraryEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      db.libraryEntry.count({ where }),
    ])

    return {
      entries,
      total,
      totalPages: Math.ceil(total / pageSize),
    }
  } catch (error) {
    console.error("Error fetching library entries:", error)
    throw new Error("Failed to fetch library entries. Please try again later.")
  }
}

/**
 * Get a single library entry by ID
 */
export async function getLibraryEntry(id: number) {
  try {
    const entry = await db.libraryEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      throw new Error(`Library entry with ID ${id} not found`)
    }

    return entry
  } catch (error) {
    console.error(`Error fetching library entry ${id}:`, error)
    throw new Error(
      "Failed to fetch library entry. It may have been deleted or you may not have permission to view it.",
    )
  }
}

/**
 * Get all unique categories for filtering
 */
export async function getCategories() {
  try {
    const categories = await db.libraryEntry.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
    })

    return categories.map((c) => c.category)
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw new Error("Failed to fetch categories. Please try again later.")
  }
}

/**
 * Create a new library entry
 */
export async function createLibraryEntry(data: Omit<LibraryEntry, "id" | "createdAt" | "updatedAt">) {
  try {
    const entry = await db.libraryEntry.create({
      data,
    })

    await logActivity({
      actionType: "CREATE",
      targetType: "LIBRARY",
      targetId: entry.id,
      details: `Created library entry: ${entry.title} (${entry.refNo})`,
    })

    revalidatePath("/admin/library")
    revalidatePath("/library")

    return entry
  } catch (error) {
    console.error("Error creating library entry:", error)
    throw new Error("Failed to create library entry. Please check your input and try again.")
  }
}

/**
 * Update an existing library entry
 */
export async function updateLibraryEntry(
  id: number,
  data: Partial<Omit<LibraryEntry, "id" | "createdAt" | "updatedAt">>,
) {
  try {
    // Get the current entry for logging
    const currentEntry = await db.libraryEntry.findUnique({
      where: { id },
      select: { title: true, refNo: true },
    })

    if (!currentEntry) {
      throw new Error(`Library entry with ID ${id} not found`)
    }

    const entry = await db.libraryEntry.update({
      where: { id },
      data,
    })

    await logActivity({
      actionType: "UPDATE",
      targetType: "LIBRARY",
      targetId: id,
      details: `Updated library entry: ${currentEntry.title} (${currentEntry.refNo})`,
    })

    // Revalidate all relevant paths
    revalidatePath("/admin/library")
    revalidatePath("/library")
    revalidatePath(`/admin/library/${id}`)
    revalidatePath(`/library/${id}`)

    return entry
  } catch (error) {
    console.error(`Error updating library entry ${id}:`, error)
    throw new Error(
      "Failed to update library entry. It may have been deleted or you may not have permission to modify it.",
    )
  }
}

/**
 * Delete a library entry
 */
export async function deleteLibraryEntry(id: number) {
  try {
    // Get the entry details for logging before deletion
    const entry = await db.libraryEntry.findUnique({
      where: { id },
      select: { title: true, refNo: true },
    })

    if (!entry) {
      throw new Error(`Library entry with ID ${id} not found`)
    }

    await db.libraryEntry.delete({
      where: { id },
    })

    await logActivity({
      actionType: "DELETE",
      targetType: "LIBRARY",
      targetId: id,
      details: `Deleted library entry: ${entry.title} (${entry.refNo})`,
    })

    revalidatePath("/admin/library")
    revalidatePath("/library")

    return { success: true }
  } catch (error) {
    console.error(`Error deleting library entry ${id}:`, error)
    throw new Error(
      "Failed to delete library entry. It may have been deleted already or you may not have permission to delete it.",
    )
  }
}

/**
 * Check out a book to a borrower
 */
export async function checkoutBook(id: number, borrower: string) {
  try {
    // Get the entry details for logging
    const entry = await db.libraryEntry.findUnique({
      where: { id },
      select: { title: true, refNo: true, borrower: true },
    })

    if (!entry) {
      throw new Error(`Library entry with ID ${id} not found`)
    }

    if (entry.borrower) {
      throw new Error(`Book is already checked out to ${entry.borrower}`)
    }

    const updatedEntry = await db.libraryEntry.update({
      where: { id },
      data: {
        borrower,
        loanDate: new Date(),
      },
    })

    await logActivity({
      actionType: "CHECKOUT",
      targetType: "LIBRARY",
      targetId: id,
      details: `Checked out book: ${entry.title} (${entry.refNo}) to ${borrower}`,
    })

    // Revalidate all relevant paths
    revalidatePath("/admin/library")
    revalidatePath("/library")
    revalidatePath(`/admin/library/${id}`)
    revalidatePath(`/library/${id}`)

    return updatedEntry
  } catch (error) {
    console.error(`Error checking out book ${id}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to check out book. Please try again later.")
  }
}

/**
 * Return a book
 */
export async function returnBook(id: number) {
  try {
    // Get the entry details for logging
    const entry = await db.libraryEntry.findUnique({
      where: { id },
      select: { title: true, refNo: true, borrower: true },
    })

    if (!entry) {
      throw new Error(`Library entry with ID ${id} not found`)
    }

    if (!entry.borrower) {
      throw new Error("Book is not currently checked out")
    }

    const updatedEntry = await db.libraryEntry.update({
      where: { id },
      data: {
        borrower: null,
        loanDate: null,
      },
    })

    await logActivity({
      actionType: "RETURN",
      targetType: "LIBRARY",
      targetId: id,
      details: `Returned book: ${entry.title} (${entry.refNo}) from ${entry.borrower}`,
    })

    // Revalidate all relevant paths
    revalidatePath("/admin/library")
    revalidatePath("/library")
    revalidatePath(`/admin/library/${id}`)
    revalidatePath(`/library/${id}`)

    return updatedEntry
  } catch (error) {
    console.error(`Error returning book ${id}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to return book. Please try again later.")
  }
}

/**
 * Get library statistics
 */
export async function getLibraryStats() {
  try {
    const [totalEntries, checkedOutCount, categoryCounts] = await db.$transaction([
      db.libraryEntry.count(),
      db.libraryEntry.count({
        where: {
          borrower: { not: null },
        },
      }),
      db.libraryEntry.groupBy({
        by: ["category"],
        _count: {
          category: true,
        },
        orderBy: {
          _count: {
            category: "desc",
          },
        },
        take: 5,
      }),
    ])

    return {
      totalEntries,
      checkedOutCount,
      availableCount: totalEntries - checkedOutCount,
      topCategories: categoryCounts.map((c) => ({
        name: c.category,
        count: (c._count as { category: number })?.category ?? 0,
      }))
      
    }
  } catch (error) {
    console.error("Error fetching library stats:", error)
    throw new Error("Failed to fetch library statistics")
  }
}

/**
 * Search for library entries by title or reference number
 * Used for autocomplete and quick search
 */
export async function quickSearchLibrary(query: string, limit = 5) {
  try {
    if (!query || query.length < 2) {
      return []
    }

    const results = await db.libraryEntry.findMany({
      where: {
        OR: [{ title: { contains: query, mode: "insensitive" } }, { refNo: { contains: query, mode: "insensitive" } }],
      },
      select: {
        id: true,
        title: true,
        refNo: true,
        category: true,
        borrower: true,
      },
      take: limit,
      orderBy: {
        title: "asc",
      },
    })

    return results
  } catch (error) {
    console.error("Error in quick search:", error)
    throw new Error("Search failed. Please try again.")
  }
}

