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
  CCY,
  createBy = "system",
}: {
  code: string
  name: string
  fullname: string
  Region: string
  WCI_URL: string
  CCY: string
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
        CCY,
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
  CCY,
  Remarks,
  modifyBy = "system",
}: {
  id: number
  code: string
  name: string
  fullname: string
  Region: string
  WCI_URL: string
  CCY: string
  Remarks: string
  modifyBy?: string
}) {
  try {
    // Step 1: Get the original location (to check if name changed)
    const existingLocation = await db.location.findUnique({
      where: { id },
    })

    if (!existingLocation) {
      throw new Error("Location not found")
    }

    const oldName = existingLocation.name
    const newName = name

    // Step 2: Update the location
    const location = await db.location.update({
      where: { id },
      data: {
        code: code.toUpperCase(),
        name: newName,
        fullname,
        Region,
        WCI_URL,
        CCY,
        Remarks,
        modifyBy,
        modifyDate: new Date(),
      },
    })

    // Step 3: If name changed, update all affected users
    if (oldName !== newName) {
      const affectedUsers = await db.user.findMany({
        where: {
          location: {
            has: oldName,
          },
        },
      })

      await Promise.all(
        affectedUsers.map((user) => {
          const updatedLocations = user.location.map((loc) =>
            loc === oldName ? newName : loc
          )
          return db.user.update({
            where: { id: user.id },
            data: {
              location: updatedLocations,
            },
          })
        })
      )
    }

    // Step 4: Log and revalidate
    await logActivity({
      actionType: "Updated Location",
      targetType: "Location",
      targetId: location.id,
      details: `Updated location ${code} - ${newName}`,
    })

    revalidatePath("/logs")
    return location
  } catch (error: any) {
    console.error("Error updating location:", error)
    throw new Error(error.message)
  }
}

// Delete a location
export async function deleteLocation(id: number) {
  try {
    // First, get the location before deletion to know the name/code
    const location = await db.location.delete({
      where: { id },
    })

    // Find all users who have this location in their `location[]` array
    const affectedUsers = await db.user.findMany({
      where: {
        location: {
          has: location.name,
        },
      },
    })

    // Remove the location from each user's array
    await Promise.all(
      affectedUsers.map((user) => {
        const updatedLocations = user.location.filter((loc) => loc !== location.name)
        return db.user.update({
          where: { id: user.id },
          data: {
            location: updatedLocations,
          },
        })
      })
    )

    // Log the deletion
    await logActivity({
      actionType: "Deleted Location",
      targetType: "Location",
      targetId: id,
      details: `Deleted location ${location.code} - ${location.name}`,
    })

    revalidatePath("/logs")
    return location
  } catch (error: any) {
    console.error("Error deleting location:", error)
    throw new Error(error.message)
  }
}

