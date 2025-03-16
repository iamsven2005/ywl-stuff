"use server"

import { PrismaClient, Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import * as bcrypt from "bcrypt"


const prisma = new PrismaClient()

export async function getUsers({
  search = "",
  page = 1,
  pageSize = 10,
}: {
  search?: string
  page?: number
  pageSize?: number
}) {
  const skip = (page - 1) * pageSize

  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { username: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {}

  const totalCount = await prisma.user.count({ where })
  const pageCount = Math.ceil(totalCount / pageSize)

  const users = await prisma.user.findMany({
    where,
    include: {
      devices: {
        include: {
          device: {
            select: {
              name: true,
            },
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


// Add a new user
export async function addUser({
  username,
  email,
  password,
}: {
  username: string
  email: string | null
  password: string
}) {
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  })

  revalidatePath("/logs")
  return user
}

// Update an existing user
export async function updateUser({
  id,
  username,
  email,
  password,
}: {
  id: number
  username: string
  email: string | null
  password?: string
}) {
  const data: any = {
    username,
    email,
  }

  // Only update password if provided
  if (password) {
    data.password = await bcrypt.hash(password, 10)
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  })

  revalidatePath("/logs")
  return user
}

// Delete a user
export async function deleteUser(id: number) {
  // First delete all device associations
  await prisma.deviceUser.deleteMany({
    where: { userId: id },
  })

  // Then delete the user
  const user = await prisma.user.delete({
    where: { id },
  })

  revalidatePath("/logs")
  return user
}

// Get devices associated with a user
export async function getUserDevices(userId: number) {
  const devices = await prisma.deviceUser.findMany({
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
    role = "viewer", // Default role set to "viewer"
  }: {
    userId: number
    deviceId: number
    role?: string
  }) {
    const existing = await prisma.deviceUser.findFirst({
      where: {
        userId,
        deviceId,
      },
    })
  
    if (existing) {
      return existing
    }
  
    const deviceUser = await prisma.deviceUser.create({
      data: {
        userId,
        deviceId,
        role, // Now required
      },
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
  const deviceUser = await prisma.deviceUser.deleteMany({
    where: {
      userId,
      deviceId,
    },
  })

  revalidatePath("/logs")
  return deviceUser
}

