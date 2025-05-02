"use server"

import { db } from "@/lib/db"
import { OrderStatus } from "@/prisma/generated/main"
import { revalidatePath } from "next/cache"


export async function getMaterials(bridgeProjectId: number) {
  try {
    const materials = await db.bridgeMaterial.findMany({
      where: { bridgeProjectId },
      include: {
        orders: {
          include: {
            vendor: true,
          },
        },
      },
    })

    return { materials }
  } catch (error) {
    console.error("Failed to fetch materials:", error)
    return { error: "Failed to fetch materials" }
  }
}

export async function getMaterial(id: number) {
  console.log(id)
  try {
    const material = await db.bridgeMaterial.findFirst({
      where: { id },
      include: {
        bridgeProject: {
          include: {
            project: true,
          },
        },
        orders: {
          include: {
            vendor: true,
          },
        },
      },
    })

    if (!material) {
      return { error: "Material not found" }
    }

    return { material }
  } catch (error) {
    console.error("Failed to fetch material:", error)
    return { error: "Failed to fetch material" }
  }
}

export async function createMaterial(data: {
  bridgeProjectId: number
  name: string
  specification?: string
  quantity: number
  unit: string
  estimatedCost?: number
}) {
  try {
    const material = await db.bridgeMaterial.create({
      data,
    })

    revalidatePath(`/crm/projects/${data.bridgeProjectId}`)
    return { material }
  } catch (error) {
    console.error("Failed to create material:", error)
    return { error: "Failed to create material" }
  }
}

export async function updateMaterial(
  id: number,
  data: {
    name?: string
    specification?: string
    quantity?: number
    unit?: string
    estimatedCost?: number
  },
) {
  try {
    const material = await db.bridgeMaterial.update({
      where: { id },
      data,
      include: {
        bridgeProject: true,
      },
    })

    revalidatePath(`/crm/projects/${material.bridgeProject.projectId}`)
    return { material }
  } catch (error) {
    console.error("Failed to update material:", error)
    return { error: "Failed to update material" }
  }
}

export async function deleteMaterial(id: number) {
  try {
    const material = await db.bridgeMaterial.findUnique({
      where: { id },
      include: {
        bridgeProject: true,
        orders: true,
      },
    })

    if (!material) {
      return { error: "Material not found" }
    }

    // Check if material has orders
    if (material.orders.length > 0) {
      return { error: "Cannot delete material with existing orders" }
    }

    await db.bridgeMaterial.delete({
      where: { id },
    })

    revalidatePath(`/crm/projects/${material.bridgeProject.projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to delete material:", error)
    return { error: "Failed to delete material" }
  }
}

export async function createMaterialOrder(data: {
  bridgeMaterialId: number
  vendorId: number
  orderDate: Date
  deliveryDate?: Date
  status: OrderStatus
  quantity: number
  unitPrice: number
  totalPrice: number
  invoiceNumber?: string
  notes?: string
}) {
  try {
    const order = await db.materialOrder.create({
      data,
      include: {
        bridgeMaterial: {
          include: {
            bridgeProject: true,
          },
        },
        vendor: true,
      },
    })

    const projectId = order.bridgeMaterial.bridgeProject.projectId
    revalidatePath(`/crm/projects/${projectId}`)
    revalidatePath(`/crm/orders`)
    return { order }
  } catch (error) {
    console.error("Failed to create material order:", error)
    return { error: "Failed to create material order" }
  }
}

export async function updateMaterialOrder(
  id: number,
  data: {
    deliveryDate?: Date
    status?: OrderStatus
    quantity?: number
    unitPrice?: number
    totalPrice?: number
    invoiceNumber?: string
    notes?: string
  },
) {
  try {
    const order = await db.materialOrder.update({
      where: { id },
      data,
      include: {
        bridgeMaterial: {
          include: {
            bridgeProject: true,
          },
        },
      },
    })

    const projectId = order.bridgeMaterial.bridgeProject.projectId
    revalidatePath(`/crm/projects/${projectId}`)
    revalidatePath(`/crm/orders`)
    return { order }
  } catch (error) {
    console.error("Failed to update material order:", error)
    return { error: "Failed to update material order" }
  }
}

export async function deleteMaterialOrder(id: number) {
  try {
    const order = await db.materialOrder.findUnique({
      where: { id },
      include: {
        bridgeMaterial: {
          include: {
            bridgeProject: true,
          },
        },
      },
    })

    if (!order) {
      return { error: "Order not found" }
    }

    await db.materialOrder.delete({
      where: { id },
    })

    const projectId = order.bridgeMaterial.bridgeProject.projectId
    revalidatePath(`/crm/projects/${projectId}`)
    revalidatePath(`/crm/orders`)
    return { success: true }
  } catch (error) {
    console.error("Failed to delete material order:", error)
    return { error: "Failed to delete material order" }
  }
}

export async function getAllMaterialOrders() {
  try {
    const orders = await db.materialOrder.findMany({
      include: {
        bridgeMaterial: {
          include: {
            bridgeProject: {
              include: {
                project: true,
              },
            },
          },
        },
        vendor: true,
      },
      orderBy: { orderDate: "desc" },
    })

    return { orders }
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return { error: "Failed to fetch orders" }
  }
}
