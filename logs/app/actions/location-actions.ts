"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"

// Get all locations with optional filtering and pagination
export async function getLocations({
  search = "",
  page = 1,
  pageSize = 10,
}: {
  search?: string
  page?: number
  pageSize?: number
} = {}) {
  const skip = (page - 1) * pageSize

  // Build the where clause for search
  const where = search
    ? {
        OR: [{ code: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }],
      }
    : {}

  // Get locations with pagination
  const locations = await db.location.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: { code: "asc" },
  })

  // Get total count for pagination
  const totalCount = await db.location.count({ where })
  const pageCount = Math.ceil(totalCount / pageSize)

  return {
    locations,
    pageCount,
    totalCount,
  }
}

// Add a new location
export async function addLocation({
  code,
  name,
  fullname,
  Region,
  WCI_URL,
  Remarks,
  createBy = "system",
}: {
  code: string
  name: string
  fullname: string
  Region: string
  WCI_URL: string
  Remarks: string
  createBy?: string
}) {
  try {
    const location = await db.location.create({
      data: {
        code: code.toUpperCase(),
        name,
        fullname,
        Region,
        WCI_URL,
        Remarks,
        createBy,
      },
    })

    await logActivity({
      actionType: "Created Location",
      targetType: "Location",
      targetId: location.id,
      details: `Created location ${code} - ${name}`,
    })

    revalidatePath("/locations")
    return location
  } catch (error: any) {
    console.error("Error adding location:", error)
    throw new Error(error.message)
  }
}

// Update an existing location
export async function updateLocation({
  id,
  code,
  name,
  fullname,
  Region,
  WCI_URL,
  Remarks,
  modifyBy = "system",
}: {
  id: number
  code: string
  name: string
  fullname?: string
  Region?: string
  WCI_URL?: string
  Remarks?: string
  modifyBy?: string
}) {
  try {
    const location = await db.location.update({
      where: { id },
      data: {
        code: code.toUpperCase(),
        name,
        fullname,
        Region,
        WCI_URL,
        Remarks,
        modifyBy,
        modifyDate: new Date(),
      },
    })

    await logActivity({
      actionType: "Updated Location",
      targetType: "Location",
      targetId: location.id,
      details: `Updated location ${code} - ${name}`,
    })

    revalidatePath("/locations")
    return location
  } catch (error: any) {
    console.error("Error updating location:", error)
    throw new Error(error.message)
  }
}

// Delete a location
export async function deleteLocation(id: number) {
  try {
    const location = await db.location.delete({
      where: { id },
    })

    await logActivity({
      actionType: "Deleted Location",
      targetType: "Location",
      targetId: id,
      details: `Deleted location ${location.code} - ${location.name}`,
    })

    revalidatePath("/locations")
    return location
  } catch (error: any) {
    console.error("Error deleting location:", error)
    throw new Error(error.message)
  }
}

