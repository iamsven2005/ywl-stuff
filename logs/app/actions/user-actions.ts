"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-logger"

export async function getUsers({
  search = "",
  page = 1,
  pageSize = 10,
  role = "",
}: {
  search?: string
  page?: number
  pageSize?: number
  role?: "ADMIN" | "USER" | "DRAFTER" | ""
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
  role = ["USER"], // default as string array
}: {
  username: string
  email: string | null
  password: string
  role?: ("ADMIN" | "USER" | "DRAFTER")[]
}) {
  const user = await db.user.create({
    data: {
      username,
      email,
      password,
      role, // ✅ this is now a string[]
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
}: {
  id: number
  username: string
  email: string | null
  password?: string
  role?: ("ADMIN" | "USER" | "DRAFTER")[]
}) {
  const data: Partial<{
    username: string
    email: string | null
    password: string
    role: ("ADMIN" | "USER" | "DRAFTER")[]
  }> = {
    username,
    email,
  }
  
  if (password) {
    data.password = password // ⚠️ Hashing is recommended before saving
  }

  if (role) {
    data.role = role
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

