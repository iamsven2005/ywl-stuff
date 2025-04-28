"use server"

import { revalidatePath } from "next/cache"
import type { AuditStep } from "./types"
import { db } from "@/lib/db"
import { StepStatus } from "@/prisma/generated/main"

// Workflow actions
export async function getWorkflows(searchQuery?: string) {
  try {
    let workflows

    if (!searchQuery) {
      workflows = await db.auditWorkflow.findMany({
        include: {
          steps: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
    } else {
      const query = searchQuery.toLowerCase()
      workflows = await db.auditWorkflow.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          steps: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
    }

    return { success: true, data: workflows }
  } catch (error) {
    console.error("Error fetching workflows:", error)
    return { success: false, error: "Failed to fetch workflows" }
  }
}

export async function getWorkflowById(id: string) {
  try {
    const workflowId = Number.parseInt(id)
    if (isNaN(workflowId)) {
      return { success: false, error: "Invalid workflow ID" }
    }

    const workflow = await db.auditWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: {
            position: "asc",
          },
        },
      },
    })

    if (!workflow) {
      return { success: false, error: "Workflow not found" }
    }

    return { success: true, data: workflow }
  } catch (error) {
    console.error("Error fetching workflow:", error)
    return { success: false, error: "Failed to fetch workflow" }
  }
}

export async function createWorkflow(data: {
  name: string
  description?: string
}) {
  try {
    const newWorkflow = await db.auditWorkflow.create({
      data: {
        name: data.name,
        description: data.description,
      },
    })

    revalidatePath("/workflows")
    revalidatePath("/")

    return { success: true, data: newWorkflow }
  } catch (error) {
    console.error("Error creating workflow:", error)
    return { success: false, error: "Failed to create workflow" }
  }
}

export async function updateWorkflow(
  id: string,
  data: {
    name?: string
    description?: string
  },
) {
  try {
    const workflowId = Number.parseInt(id)
    if (isNaN(workflowId)) {
      return { success: false, error: "Invalid workflow ID" }
    }

    const updatedWorkflow = await db.auditWorkflow.update({
      where: { id: workflowId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/workflows/${id}`)
    revalidatePath("/workflows")
    revalidatePath("/")

    return { success: true, data: updatedWorkflow }
  } catch (error) {
    console.error("Error updating workflow:", error)
    return { success: false, error: "Failed to update workflow" }
  }
}

export async function deleteWorkflow(id: string) {
  try {
    const workflowId = Number.parseInt(id)
    if (isNaN(workflowId)) {
      return { success: false, error: "Invalid workflow ID" }
    }

    // First delete all steps and their logs
    await db.$transaction([
      // Delete logs for all steps in this workflow
      db.stepLog.deleteMany({
        where: {
          step: {
            workflowId: workflowId,
          },
        },
      }),
      // Delete all steps in this workflow
      db.auditStep.deleteMany({
        where: {
          workflowId: workflowId,
        },
      }),
      // Delete the workflow
      db.auditWorkflow.delete({
        where: { id: workflowId },
      }),
    ])

    revalidatePath("/workflows")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting workflow:", error)
    return { success: false, error: "Failed to delete workflow" }
  }
}

// Step actions
export async function getStepsByWorkflowId(workflowId: string, searchQuery?: string) {
  try {
    const parsedWorkflowId = Number.parseInt(workflowId)
    if (isNaN(parsedWorkflowId)) {
      return { success: false, error: "Invalid workflow ID" }
    }

    // Check if workflow exists
    const workflow = await db.auditWorkflow.findUnique({
      where: { id: parsedWorkflowId },
    })

    if (!workflow) {
      return { success: false, error: "Workflow not found" }
    }

    let whereClause: any = {
      workflowId: parsedWorkflowId,
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      whereClause = {
        ...whereClause,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      }
    }

    const steps = await db.auditStep.findMany({
      where: whereClause,
      include: {
        assignedTo: true,
      },
      orderBy: {
        position: "asc",
      },
    })

    return { success: true, data: steps }
  } catch (error) {
    console.error("Error fetching steps:", error)
    return { success: false, error: "Failed to fetch steps" }
  }
}

export async function createStep(
  workflowId: string,
  data: {
    title: string
    description?: string
    status?: string
    assignedToId?: string | null
    dueDate?: string | null
  },
) {
  try {
    const parsedWorkflowId = Number.parseInt(workflowId)
    if (isNaN(parsedWorkflowId)) {
      return { success: false, error: "Invalid workflow ID" }
    }

    // Check if workflow exists
    const workflow = await db.auditWorkflow.findUnique({
      where: { id: parsedWorkflowId },
    })

    if (!workflow) {
      return { success: false, error: "Workflow not found" }
    }

    // Get the highest position to add the new step at the end
    const highestPositionStep = await db.auditStep.findFirst({
      where: { workflowId: parsedWorkflowId },
      orderBy: { position: "desc" },
    })

    const position = highestPositionStep ? highestPositionStep.position + 1 : 0

    // Parse assignedToId if provided
    let assignedToIdParsed = null
    if (data.assignedToId && data.assignedToId !== "unassigned") {
      assignedToIdParsed = Number.parseInt(data.assignedToId)
      if (isNaN(assignedToIdParsed)) {
        return { success: false, error: "Invalid user ID" }
      }
    }

    // Parse status
    let statusParsed: StepStatus = StepStatus.PENDING
    if (data.status && Object.values(StepStatus).includes(data.status as StepStatus)) {
      statusParsed = data.status as StepStatus
    }

    // Parse due date
    let dueDateParsed = null
    if (data.dueDate) {
      dueDateParsed = new Date(data.dueDate)
    }

    const newStep = await db.auditStep.create({
      data: {
        title: data.title,
        description: data.description,
        position,
        status: statusParsed,
        assignedToId: assignedToIdParsed,
        dueDate: dueDateParsed,
        workflowId: parsedWorkflowId,
      },
      include: {
        assignedTo: true,
      },
    })

    // Update the workflow's updatedAt
    await db.auditWorkflow.update({
      where: { id: parsedWorkflowId },
      data: { updatedAt: new Date() },
    })

    revalidatePath(`/workflows/${workflowId}`)
    revalidatePath(`/workflows/${workflowId}/edit`)

    return { success: true, data: newStep }
  } catch (error) {
    console.error("Error creating step:", error)
    return { success: false, error: "Failed to create step" }
  }
}

export async function updateStep(workflowId: string, stepId: string, data: Partial<AuditStep>) {
  try {
    const parsedWorkflowId = Number.parseInt(workflowId)
    const parsedStepId = Number.parseInt(stepId)

    if (isNaN(parsedWorkflowId) || isNaN(parsedStepId)) {
      return { success: false, error: "Invalid ID format" }
    }

    // Check if step exists and belongs to the workflow
    const existingStep = await db.auditStep.findFirst({
      where: {
        id: parsedStepId,
        workflowId: parsedWorkflowId,
      },
    })

    if (!existingStep) {
      return { success: false, error: "Step not found or doesn't belong to the workflow" }
    }

    // Prepare data for update
    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.position !== undefined) updateData.position = data.position

    // Handle assignedToId
    if (data.assignedToId !== undefined) {
      if (data.assignedToId === null) {
        updateData.assignedToId = null
      } else {
        const parsedAssignedToId = Number.parseInt(data.assignedToId.toString())
        if (!isNaN(parsedAssignedToId)) {
          updateData.assignedToId = parsedAssignedToId
        }
      }
    }

    // Handle dueDate
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }

    const updatedStep = await db.auditStep.update({
      where: { id: parsedStepId },
      data: updateData,
      include: {
        assignedTo: true,
      },
    })

    // Update the workflow's updatedAt
    await db.auditWorkflow.update({
      where: { id: parsedWorkflowId },
      data: { updatedAt: new Date() },
    })

    revalidatePath(`/workflows/${workflowId}`)
    revalidatePath(`/workflows/${workflowId}/edit`)

    return { success: true, data: updatedStep }
  } catch (error) {
    console.error("Error updating step:", error)
    return { success: false, error: "Failed to update step" }
  }
}

export async function deleteStep(workflowId: string, stepId: string) {
  try {
    const parsedWorkflowId = Number.parseInt(workflowId)
    const parsedStepId = Number.parseInt(stepId)

    if (isNaN(parsedWorkflowId) || isNaN(parsedStepId)) {
      return { success: false, error: "Invalid ID format" }
    }

    // Check if step exists and belongs to the workflow
    const existingStep = await db.auditStep.findFirst({
      where: {
        id: parsedStepId,
        workflowId: parsedWorkflowId,
      },
    })

    if (!existingStep) {
      return { success: false, error: "Step not found or doesn't belong to the workflow" }
    }

    // First delete all logs for this step
    await db.stepLog.deleteMany({
      where: { stepId: parsedStepId },
    })

    // Then delete the step
    await db.auditStep.delete({
      where: { id: parsedStepId },
    })

    // Reorder remaining steps
    const remainingSteps = await db.auditStep.findMany({
      where: { workflowId: parsedWorkflowId },
      orderBy: { position: "asc" },
    })

    // Update positions for all remaining steps
    for (let i = 0; i < remainingSteps.length; i++) {
      await db.auditStep.update({
        where: { id: remainingSteps[i].id },
        data: { position: i },
      })
    }

    // Update the workflow's updatedAt
    await db.auditWorkflow.update({
      where: { id: parsedWorkflowId },
      data: { updatedAt: new Date() },
    })

    revalidatePath(`/workflows/${workflowId}`)
    revalidatePath(`/workflows/${workflowId}/edit`)

    return { success: true }
  } catch (error) {
    console.error("Error deleting step:", error)
    return { success: false, error: "Failed to delete step" }
  }
}

export async function reorderSteps(workflowId: string, stepIds: string[]) {
  try {
    const parsedWorkflowId = Number.parseInt(workflowId)
    if (isNaN(parsedWorkflowId)) {
      return { success: false, error: "Invalid workflow ID" }
    }

    // Convert string IDs to numbers
    const parsedStepIds = stepIds.map((id) => Number.parseInt(id))
    if (parsedStepIds.some((id) => isNaN(id))) {
      return { success: false, error: "Invalid step ID format" }
    }

    // Check if all steps exist and belong to the workflow
    const steps = await db.auditStep.findMany({
      where: {
        id: { in: parsedStepIds },
        workflowId: parsedWorkflowId,
      },
    })

    if (steps.length !== parsedStepIds.length) {
      return { success: false, error: "One or more steps not found or don't belong to the workflow" }
    }

    // Update positions in a transaction
    await db.$transaction(
      parsedStepIds.map((stepId, index) =>
        db.auditStep.update({
          where: { id: stepId },
          data: { position: index },
        }),
      ),
    )

    // Update the workflow's updatedAt
    await db.auditWorkflow.update({
      where: { id: parsedWorkflowId },
      data: { updatedAt: new Date() },
    })

    // Get updated steps
    const updatedSteps = await db.auditStep.findMany({
      where: { workflowId: parsedWorkflowId },
      orderBy: { position: "asc" },
      include: { assignedTo: true },
    })

    revalidatePath(`/workflows/${workflowId}`)
    revalidatePath(`/workflows/${workflowId}/edit`)

    return { success: true, data: updatedSteps }
  } catch (error) {
    console.error("Error reordering steps:", error)
    return { success: false, error: "Failed to reorder steps" }
  }
}

// Log actions
export async function getLogsByStepId(stepId: string) {
  try {
    const parsedStepId = Number.parseInt(stepId)
    if (isNaN(parsedStepId)) {
      return { success: false, error: "Invalid step ID" }
    }

    const logs = await db.stepLog.findMany({
      where: { stepId: parsedStepId },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: logs }
  } catch (error) {
    console.error("Error fetching logs:", error)
    return { success: false, error: "Failed to fetch logs" }
  }
}

export async function createLog(
  stepId: string,
  data: {
    message: string
    createdBy: string
  },
) {
  try {
    const parsedStepId = Number.parseInt(stepId)
    if (isNaN(parsedStepId)) {
      return { success: false, error: "Invalid step ID" }
    }

    // Check if step exists
    const step = await db.auditStep.findUnique({
      where: { id: parsedStepId },
      include: { workflow: true },
    })

    if (!step) {
      return { success: false, error: "Step not found" }
    }

    const newLog = await db.stepLog.create({
      data: {
        stepId: parsedStepId,
        message: data.message,
        createdBy: data.createdBy,
      },
    })

    // Update the workflow's updatedAt
    await db.auditWorkflow.update({
      where: { id: step.workflowId },
      data: { updatedAt: new Date() },
    })

    revalidatePath(`/workflows/${step.workflowId}`)

    return { success: true, data: newLog }
  } catch (error) {
    console.error("Error creating log:", error)
    return { success: false, error: "Failed to create log" }
  }
}

// User actions
export async function getUsers() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    return { success: true, data: users }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function getCurrentUser() {
  // In a real app, this would get the current authenticated user
  // For now, we'll return a mock user
  try {
    const user = await db.user.findFirst({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      return {
        success: true,
        data: {
          id: 1,
          username: "demo_user",
          email: "demo@example.com",
          role: ["user"],
        },
      }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error("Error fetching current user:", error)
    return {
      success: true,
      data: {
        id: 1,
        username: "demo_user",
        email: "demo@example.com",
        role: ["user"],
      },
    }
  }
}
