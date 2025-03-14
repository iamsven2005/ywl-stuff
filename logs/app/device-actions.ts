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

interface GetDevicesParams {
  search?: string
  page?: number
  pageSize?: number
}

export async function getDevices({ search = "", page = 1, pageSize = 10 }: GetDevicesParams) {
  try {
    // Build where conditions
    const where: any = {}

    // Add search condition if provided
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { ip_address: { contains: search } },
        { mac_address: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.devices.count({ where })

    // Get devices with pagination
    const devices = await prisma.devices.findMany({
      where,
      orderBy: {
        time: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      devices,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize),
    }
  } catch (error) {
    console.error("Error fetching devices:", error)
    throw new Error("Failed to fetch devices")
  }
}

interface DeviceData {
  name: string
  ip_address: string | null
  mac_address: string | null
  password: string | null
  notes: string
}

export async function addDevice(data: DeviceData) {
  try {
    const device = await prisma.devices.create({
      data: {
        name: data.name,
        ip_address: data.ip_address,
        mac_address: data.mac_address,
        password: data.password,
        notes: data.notes,
      },
    })
    return { success: true, device }
  } catch (error) {
    console.error("Error adding device:", error)
    throw new Error("Failed to add device")
  }
}

interface UpdateDeviceData extends DeviceData {
  id: number
}

export async function updateDevice(data: UpdateDeviceData) {
  try {
    const device = await prisma.devices.update({
      where: { id: data.id },
      data: {
        name: data.name,
        ip_address: data.ip_address,
        mac_address: data.mac_address,
        password: data.password,
        notes: data.notes,
      },
    })
    return { success: true, device }
  } catch (error) {
    console.error("Error updating device:", error)
    throw new Error("Failed to update device")
  }
}

export async function deleteDevice(id: number) {
  try {
    await prisma.devices.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting device:", error)
    throw new Error("Failed to delete device")
  }
}

// Add this function to get all device names for filtering
export async function getAllDeviceNames() {
  try {
    const devices = await prisma.devices.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return devices.map((device) => device.name)
  } catch (error) {
    console.error("Error fetching device names:", error)
    throw new Error("Failed to fetch device names")
  }
}

