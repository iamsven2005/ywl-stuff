"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"
import { writeFile } from "fs/promises"
import path from "path"
export async function getUsers({
  search = "",
  page = 1,
  pageSize = 10,
  role = "",
}: {
  search?: string
  page?: number
  pageSize?: number
  role?: string
}) {
  const skip = (page - 1) * pageSize

  const where: any = {}

  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  if (role) {
    where.role = role
  }

  const totalCount = await db.user.count({ where })
  const pageCount = Math.ceil(totalCount / pageSize)

  const users = await db.user.findMany({
    where,
    include: {
      devices: {
        include: {
          device: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { id: "desc" },
    skip,
    take: pageSize,
  })
  console.log(users)
  return {
    users,
    totalCount,
    pageCount,
  }
}


export async function getAdminUsers() {
  const adminUsers = await db.user.findMany({
    where: {
      role: {
        has: "admin",
      },
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
  })

  return adminUsers
}


export async function addUser({
  username,
  email,
  password,
  role, 
  location, 
  Remarks,
}: {
  username: string
  email: string | null
  password: string
  role: string[]
  location: string[]
  Remarks: string | null
}) {
  const user = await db.user.create({
    data: {
      username,
      email,
      password,
      role, // ✅ this is now a string[]
      location,
      Remarks
    },
  })


  await logActivity({
    actionType: "Created User",
    targetType: "User",
    targetId: user.id,
    details: `Created user: ${username} with role: ${role}`,
  })

  revalidatePath("/logs")
  return user
}


export async function updateUser({
  id,
  username,
  email,
  password,
  role,
  location,
  Remarks,
}: {
  id: number
  username: string
  email: string | null
  password?: string
  role: string[]
  location: string[]
  Remarks: string | null
}) {
  const data: Partial<{
    username: string
    email: string | null
    password: string
    role: string[]
    location: string[]
    Remarks: string | null
  }> = {
    username,
    email,
    Remarks,
    role,
    location,
  }
  
  if (password) {
    data.password = password // ⚠️ Hashing is recommended before saving
  }

  const user = await db.user.update({
    where: { id },
    data,
  })

  await logActivity({
    actionType: "Updated User",
    targetType: "User",
    targetId: user.id,
    details: `Updated user: ${username}${role ? ` with role: ${role}` : ""}`,
  })

  revalidatePath("/logs")
  return user
}

// Delete a user
export async function deleteUser(id: number) {
  // Get user details before deletion
  const user = await db.user.findUnique({
    where: { id },
    select: { username: true, role: true },
  })

  await db.deviceUser.deleteMany({
    where: { userId: id },
  })

  await db.user.delete({
    where: { id },
  })

  // Log the activity
  await logActivity({
    actionType: "Deleted User",
    targetType: "User",
    targetId: id,
    details: `Deleted user: ${user?.username || "Unknown"}${user?.role ? ` with role: ${user.role}` : ""}`,
  })

  revalidatePath("/logs")
  return { success: true }
}

// Get devices associated with a user
export async function getUserDevices(userId: number) {
  const devices = await db.deviceUser.findMany({
    where: { userId },
    include: {
      device: {
        select: {
          name: true,
        },
      },
    },
  })

  return devices
}

export async function assignDeviceToUser({
  userId,
  deviceId,
  role = "viewer",
}: {
  userId: number
  deviceId: number
  role?: string
}) {
  const existing = await db.deviceUser.findFirst({
    where: {
      userId,
      deviceId,
    },
  })

  if (existing) {
    return existing
  }

  const deviceUser = await db.deviceUser.create({
    data: {
      userId,
      deviceId,
      role,
    },
    include: {
      user: {
        select: { username: true },
      },
      device: {
        select: { name: true },
      },
    },
  })

  // Log the activity
  await logActivity({
    actionType: "Assigned Device",
    targetType: "Device",
    targetId: deviceId,
    details: `Assigned device: ${deviceUser.device.name} to user: ${deviceUser.user.username} with role: ${role}`,
  })

  return deviceUser
}

// Remove a device from a user
export async function removeDeviceFromUser({
  userId,
  deviceId,
}: {
  userId: number
  deviceId: number
}) {
  // Get details before removal
  const deviceUser = await db.deviceUser.findFirst({
    where: {
      userId,
      deviceId,
    },
    include: {
      user: {
        select: { username: true },
      },
      device: {
        select: { name: true },
      },
    },
  })

  await db.deviceUser.deleteMany({
    where: {
      userId,
      deviceId,
    },
  })

  // Log the activity
  if (deviceUser) {
    await logActivity({
      actionType: "Removed Device",
      targetType: "Device",
      targetId: deviceId,
      details: `Removed device: ${deviceUser.device.name} from user: ${deviceUser.user.username}`,
    })
  }

  revalidatePath("/logs")
  return { success: true }
}

export async function uploadNdaDocument(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const userId = Number.parseInt(formData.get("userId") as string)

    if (!file || !userId) {
      return {
        success: false,
        error: "Missing file or user ID",
      }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads", "nda")

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save file with user ID in filename
    const filename = `nda_${userId}_${Date.now()}.pdf`
    const filepath = path.join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    // Update user record with NDA file path
    await db.user.update({
      where: { id: userId },
      data: {
        ndafile: filename,
        updatedAt: new Date(),
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Uploaded NDA",
      targetType: "User",
      targetId: userId,
      details: "Uploaded NDA document",
    })

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Error uploading NDA document:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
export async function updateUserProfile({
  userId,
  Mobile,
  PrimaryContact,
  MobileContact,
  Relationship,
  SecondContact,
  SecondMobile,
  SecondRelationship,
  Remarks,
  email,
  username,
}: {
  userId: number
  Mobile?: number | null
  PrimaryContact?: string | null
  MobileContact?: number | null
  Relationship?: string | null
  SecondContact?: string | null
  SecondMobile?: number | null
  SecondRelationship?: string | null
  Remarks?: string | null
  email?: string | null
  username?: string
}) {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Only include fields that are provided
    if (Mobile !== undefined) updateData.Mobile = Mobile
    if (PrimaryContact !== undefined) updateData.PrimaryContact = PrimaryContact
    if (MobileContact !== undefined) updateData.MobileContact = MobileContact
    if (Relationship !== undefined) updateData.Relationship = Relationship
    if (SecondContact !== undefined) updateData.SecondContact = SecondContact
    if (SecondMobile !== undefined) updateData.SecondMobile = SecondMobile
    if (SecondRelationship !== undefined) updateData.SecondRelationship = SecondRelationship
    if (Remarks !== undefined) updateData.Remarks = Remarks
    if (email !== undefined) updateData.email = email
    if (username !== undefined) updateData.username = username

    await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Log the activity
    await logActivity({
      actionType: "Updated Profile",
      targetType: "User",
      targetId: userId,
      details: "Updated user profile information",
    })

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getUserById(id: number) {
  const user = await db.user.findUnique({
    where: { id },
  })

  return user
}