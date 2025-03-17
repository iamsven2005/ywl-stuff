"use server"

import { logActivity } from "@/lib/activity-logger"
import { db } from "@/lib/db"

interface GetDevicesParams {
  search?: string
  page?: number
  pageSize?: number
}

// Update the getDevices function to include user information
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
    const totalCount = await db.devices.count({ where })

    // Get devices with pagination and include users
    const devices = await db.devices.findMany({
      where,
      include: {
        users: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
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
    const device = await db.devices.create({
      data: {
        name: data.name,
        ip_address: data.ip_address,
        mac_address: data.mac_address,
        password: data.password,
        notes: data.notes,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Created Device",
      targetType: "Device",
      targetId: device.id,
      details: `Created device: ${data.name}`,
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
    const device = await db.devices.update({
      where: { id: data.id },
      data: {
        name: data.name,
        ip_address: data.ip_address,
        mac_address: data.mac_address,
        password: data.password,
        notes: data.notes,
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Updated Device",
      targetType: "Device",
      targetId: device.id,
      details: `Updated device: ${data.name}`,
    })

    return { success: true, device }
  } catch (error) {
    console.error("Error updating device:", error)
    throw new Error("Failed to update device")
  }
}

export async function deleteDevice(id: number) {
  try {
    const device = await db.devices.findUnique({
      where: { id },
      select: { name: true },
    })

    await db.devices.delete({
      where: { id },
    })

    // Log the activity
    await logActivity({
      actionType: "Deleted Device",
      targetType: "Device",
      targetId: id,
      details: `Deleted device: ${device?.name || "Unknown"}`,
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
    const devices = await db.devices.findMany({
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

