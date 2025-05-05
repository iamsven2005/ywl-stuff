"use server"

import { revalidatePath } from "next/cache"
import { EquipmentStatus, EquipmentCondition, MaintenanceType } from "@/prisma/generated/main"
import { db } from "@/lib/db"

// Equipment Categories
export async function getEquipmentCategories() {
  try {
    const categories = await db.equipmentCategory.findMany({
      orderBy: { name: "asc" },
    })
    return { categories }
  } catch (error) {
    console.error("Failed to fetch equipment categories:", error)
    return { error: "Failed to fetch equipment categories" }
  }
}

export async function createEquipmentCategory(data: { name: string; description?: string }) {
  try {
    const category = await db.equipmentCategory.create({
      data,
    })
    revalidatePath("/equipment/categories")
    return { category }
  } catch (error) {
    console.error("Failed to create equipment category:", error)
    return { error: "Failed to create equipment category" }
  }
}

// Equipment
export async function getEquipment(filters?: {
  categoryId?: number
  status?: EquipmentStatus
  condition?: EquipmentCondition
  search?: string
}) {
  try {
    const where: any = {}

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.condition) {
      where.condition = filters.condition
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { itemCode: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const equipment = await db.equipment.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { itemCode: "asc" },
    })

    return { equipment }
  } catch (error) {
    console.error("Failed to fetch equipment:", error)
    return { error: "Failed to fetch equipment" }
  }
}

export async function getEquipmentById(id: number) {
  try {
    const equipment = await db.equipment.findUnique({
      where: { id },
      include: {
        category: true,
        loans: {
          include: {
            project: true,
            company: true,
            contact: true,
          },
          orderBy: { checkoutDate: "desc" },
          take: 10,
        },
        maintenanceRecords: {
          orderBy: { startDate: "desc" },
          take: 10,
        },
        allocations: {
          include: {
            project: true,
          },
          orderBy: { startDate: "desc" },
        },
      },
    })

    if (!equipment) {
      return { error: "Equipment not found" }
    }

    return { equipment }
  } catch (error) {
    console.error("Failed to fetch equipment:", error)
    return { error: "Failed to fetch equipment" }
  }
}

export async function createEquipment(data: {
  itemCode: string
  name: string
  description?: string
  categoryId: number
  manufacturer?: string
  model?: string
  serialNumber?: string
  purchaseDate?: Date
  purchasePrice?: number
  warrantyExpiry?: Date
  location?: string
  status?: EquipmentStatus
  condition?: EquipmentCondition
  notes?: string
  totalQuantity?: number
}) {
  try {
    // Set default quantities based on total
    const totalQuantity = data.totalQuantity || 1

    const equipment = await db.equipment.create({
      data: {
        ...data,
        totalQuantity,
        availableQuantity: totalQuantity,
        inStoreQuantity: totalQuantity,
      },
    })

    revalidatePath("/equipment")
    return { equipment }
  } catch (error) {
    console.error("Failed to create equipment:", error)
    return { error: "Failed to create equipment" }
  }
}

export async function updateEquipment(
  id: number,
  data: {
    name?: string
    description?: string
    categoryId?: number
    manufacturer?: string
    model?: string
    serialNumber?: string
    purchaseDate?: Date
    purchasePrice?: number
    warrantyExpiry?: Date
    location?: string
    status?: EquipmentStatus
    condition?: EquipmentCondition
    lastMaintenanceDate?: Date
    nextMaintenanceDate?: Date
    notes?: string
    totalQuantity?: number
    availableQuantity?: number
    onLoanQuantity?: number
    damagedQuantity?: number
    repairQuantity?: number
    inStoreQuantity?: number
  },
) {
  try {
    const equipment = await db.equipment.update({
      where: { id },
      data,
    })

    revalidatePath("/equipment")
    revalidatePath(`/equipment/${id}`)
    return { equipment }
  } catch (error) {
    console.error("Failed to update equipment:", error)
    return { error: "Failed to update equipment" }
  }
}

// Equipment Loans
export async function createEquipmentLoan(data: {
  equipmentId: number
  projectId?: number
  companyId?: number
  contactId?: number
  quantity: number
  checkoutDate: Date
  expectedReturnDate: Date
  checkedOutBy: string
  checkedOutNotes?: string
}) {
  try {
    // Get current equipment
    const equipment = await db.equipment.findUnique({
      where: { id: data.equipmentId },
    })

    if (!equipment) {
      return { error: "Equipment not found" }
    }

    // Check if enough quantity is available
    if (equipment.availableQuantity < data.quantity) {
      return { error: `Only ${equipment.availableQuantity} units available` }
    }

    // Create loan and update equipment quantities in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the loan
      const loan = await tx.equipmentLoan.create({
        data,
      })

      // Update equipment quantities
      const updatedEquipment = await tx.equipment.update({
        where: { id: data.equipmentId },
        data: {
          availableQuantity: equipment.availableQuantity - data.quantity,
          onLoanQuantity: equipment.onLoanQuantity + data.quantity,
          status: equipment.availableQuantity - data.quantity <= 0 ? EquipmentStatus.ON_LOAN : equipment.status,
        },
      })

      return { loan, updatedEquipment }
    })

    revalidatePath("/equipment")
    revalidatePath(`/equipment/${data.equipmentId}`)
    if (data.projectId) revalidatePath(`/projects/${data.projectId}`)

    return { loan: result.loan }
  } catch (error) {
    console.error("Failed to create equipment loan:", error)
    return { error: "Failed to create equipment loan" }
  }
}

export async function returnEquipmentLoan(
  id: number,
  data: {
    actualReturnDate: Date
    returnCondition: EquipmentCondition
    returnNotes?: string
  },
) {
  try {
    // Get the loan
    const loan = await db.equipmentLoan.findUnique({
      where: { id },
    })

    if (!loan) {
      return { error: "Loan not found" }
    }

    // Get the equipment
    const equipment = await db.equipment.findUnique({
      where: { id: loan.equipmentId },
    })

    if (!equipment) {
      return { error: "Equipment not found" }
    }

    // Calculate quantities based on condition
    let damagedIncrease = 0
    let repairIncrease = 0
    let availableIncrease = 0

    if (data.returnCondition === EquipmentCondition.EXCELLENT || data.returnCondition === EquipmentCondition.GOOD) {
      availableIncrease = loan.quantity
    } else if (data.returnCondition === EquipmentCondition.FAIR) {
      // Might need maintenance but still usable
      availableIncrease = loan.quantity
      // Schedule maintenance
    } else if (data.returnCondition === EquipmentCondition.POOR) {
      // Needs repair
      repairIncrease = loan.quantity
    } else if (data.returnCondition === EquipmentCondition.UNUSABLE) {
      // Damaged beyond repair
      damagedIncrease = loan.quantity
    }

    // Update loan and equipment in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update the loan
      const updatedLoan = await tx.equipmentLoan.update({
        where: { id },
        data,
      })

      // Update equipment quantities
      const updatedEquipment = await tx.equipment.update({
        where: { id: loan.equipmentId },
        data: {
          availableQuantity: equipment.availableQuantity + availableIncrease,
          onLoanQuantity: equipment.onLoanQuantity - loan.quantity,
          damagedQuantity: equipment.damagedQuantity + damagedIncrease,
          repairQuantity: equipment.repairQuantity + repairIncrease,
          inStoreQuantity: equipment.inStoreQuantity + loan.quantity,
          // Update status based on new quantities
          status:
            equipment.onLoanQuantity - loan.quantity <= 0
              ? repairIncrease > 0
                ? EquipmentStatus.IN_MAINTENANCE
                : damagedIncrease > 0
                  ? EquipmentStatus.DAMAGED
                  : EquipmentStatus.AVAILABLE
              : equipment.status,
        },
      })

      return { loan: updatedLoan, equipment: updatedEquipment }
    })

    revalidatePath("/equipment")
    revalidatePath(`/equipment/${loan.equipmentId}`)
    if (loan.projectId) revalidatePath(`/projects/${loan.projectId}`)

    return { loan: result.loan }
  } catch (error) {
    console.error("Failed to return equipment loan:", error)
    return { error: "Failed to return equipment loan" }
  }
}

// Equipment Maintenance
export async function createEquipmentMaintenance(data: {
  equipmentId: number
  maintenanceType: MaintenanceType
  startDate: Date
  endDate?: Date
  cost?: number
  performedBy?: string
  description?: string
  notes?: string
  attachments?: string[]
}) {
  try {
    // Get current equipment
    const equipment = await db.equipment.findUnique({
      where: { id: data.equipmentId },
    })

    if (!equipment) {
      return { error: "Equipment not found" }
    }

    // Create maintenance record and update equipment in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the maintenance record
      const maintenance = await tx.equipmentMaintenance.create({
        data,
      })

      // Update equipment status and maintenance dates
      const updatedEquipment = await tx.equipment.update({
        where: { id: data.equipmentId },
        data: {
          status: data.endDate ? equipment.status : EquipmentStatus.IN_MAINTENANCE,
          lastMaintenanceDate: data.startDate,
          // If it's a routine maintenance, schedule the next one
          ...(data.maintenanceType === MaintenanceType.ROUTINE && {
            nextMaintenanceDate: new Date(data.startDate.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days later
          }),
        },
      })

      return { maintenance, updatedEquipment }
    })

    revalidatePath("/equipment")
    revalidatePath(`/equipment/${data.equipmentId}`)

    return { maintenance: result.maintenance }
  } catch (error) {
    console.error("Failed to create equipment maintenance:", error)
    return { error: "Failed to create equipment maintenance" }
  }
}

// Project Equipment Allocation
export async function allocateEquipmentToProject(data: {
  projectId: number
  equipmentId: number
  quantity: number
  startDate: Date
  endDate?: Date
  notes?: string
}) {
  try {
    // Check if allocation already exists
    const existingAllocation = await db.projectEquipmentAllocation.findUnique({
      where: {
        projectId_equipmentId: {
          projectId: data.projectId,
          equipmentId: data.equipmentId,
        },
      },
    })

    if (existingAllocation) {
      // Update existing allocation
      const allocation = await db.projectEquipmentAllocation.update({
        where: {
          projectId_equipmentId: {
            projectId: data.projectId,
            equipmentId: data.equipmentId,
          },
        },
        data: {
          quantity: data.quantity,
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes,
        },
      })

      revalidatePath(`/projects/${data.projectId}`)
      revalidatePath("/equipment")

      return { allocation }
    } else {
      // Create new allocation
      const allocation = await db.projectEquipmentAllocation.create({
        data,
      })

      revalidatePath(`/projects/${data.projectId}`)
      revalidatePath("/equipment")

      return { allocation }
    }
  } catch (error) {
    console.error("Failed to allocate equipment to project:", error)
    return { error: "Failed to allocate equipment to project" }
  }
}

export async function removeEquipmentAllocation(id: number) {
  try {
    const allocation = await db.projectEquipmentAllocation.findUnique({
      where: { id },
    })

    if (!allocation) {
      return { error: "Allocation not found" }
    }

    await db.projectEquipmentAllocation.delete({
      where: { id },
    })

    revalidatePath(`/projects/${allocation.projectId}`)
    revalidatePath("/equipment")

    return { success: true }
  } catch (error) {
    console.error("Failed to remove equipment allocation:", error)
    return { error: "Failed to remove equipment allocation" }
  }
}

// Equipment Dashboard Stats
export async function getEquipmentStats() {
  try {
    const totalEquipment = await db.equipment.count()

    const equipmentByStatus = await db.equipment.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    })

    const equipmentByCondition = await db.equipment.groupBy({
      by: ["condition"],
      _count: {
        id: true,
      },
    })

    const equipmentByCategory = await db.equipment.groupBy({
      by: ["categoryId"],
      _count: {
        id: true,
      },
    })

    const categories = await db.equipmentCategory.findMany({
      where: {
        id: {
          in: equipmentByCategory.map((item) => item.categoryId),
        },
      },
    })

    const categoryMap = categories.reduce((acc, category) => {
      acc[category.id] = category.name
      return acc
    }, {})

    const formattedCategoryData = equipmentByCategory.map((item) => ({
      category: categoryMap[item.categoryId] || "Unknown",
      count: item._count.id,
    }))

    const activeLoans = await db.equipmentLoan.count({
      where: {
        actualReturnDate: null,
      },
    })

    const scheduledMaintenance = await db.equipment.count({
      where: {
        nextMaintenanceDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      },
    })

    return {
      totalEquipment,
      statusBreakdown: equipmentByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      conditionBreakdown: equipmentByCondition.map((item) => ({
        condition: item.condition,
        count: item._count.id,
      })),
      categoryBreakdown: formattedCategoryData,
      activeLoans,
      scheduledMaintenance,
    }
  } catch (error) {
    console.error("Failed to fetch equipment stats:", error)
    return { error: "Failed to fetch equipment stats" }
  }
}
