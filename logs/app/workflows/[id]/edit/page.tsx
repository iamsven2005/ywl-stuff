"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, GripVertical } from "lucide-react"
import {
  getWorkflowById,
  updateWorkflow,
  updateStep,
  deleteStep,
  reorderSteps,
  getUsers,
} from "../../actions"
import type { AuditWorkflow, AuditStep, User } from "../../types"
import { toast } from "@/app/hooks/use-toast"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { EditStepItem } from "./edit-step-item"
import { AddStepForm } from "../../add-step-form"

export default function EditWorkflowPage() {
  const { id } = useParams()
  const router = useRouter()
  const [workflow, setWorkflow] = useState<AuditWorkflow | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [steps, setSteps] = useState<AuditStep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch workflow
        const workflowResult = await getWorkflowById(id as string)
        if (workflowResult.success) {
          setWorkflow(workflowResult.data)
          setName(workflowResult.data.name)
          setDescription(workflowResult.data.description || "")
          setSteps([...workflowResult.data.steps].sort((a, b) => a.position - b.position))
        } else {
          setError(workflowResult.error || "Failed to load workflow")
        }

        // Fetch users
        const usersResult = await getUsers()
        if (usersResult.success) {
          setUsers(usersResult.data)
        }
      } catch (err) {
        setError("An unexpected error occurred")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
          <span className="ml-2">Loading workflow...</span>
        </div>
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="container py-10">
        <div className="p-4 border rounded-md bg-destructive/10 text-destructive">{error || "Workflow not found"}</div>
      </div>
    )
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(steps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update positions locally first for immediate UI feedback
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }))

    setSteps(updatedItems)

    // Then update on the server
    try {
      const stepIds = updatedItems.map((step) => step.id.toString())
      await reorderSteps(workflow.id.toString(), stepIds)
    } catch (err) {
      console.error("Error reordering steps:", err)
      // If there's an error, we could fetch the steps again to reset to server state
    }
  }

  const handleUpdateStep = async (updatedStep: AuditStep) => {
    try {
      // Update locally first for immediate UI feedback
      setSteps(steps.map((step) => (step.id === updatedStep.id ? updatedStep : step)))

      // Then update on the server
      await updateStep(workflow.id.toString(), updatedStep.id.toString(), updatedStep)
    } catch (err) {
      console.error("Error updating step:", err)
      setError("An unexpected error occurred")
    }
  }

  const handleDeleteStep = async (stepId: number) => {
    try {
      // Update locally first for immediate UI feedback
      const updatedSteps = steps.filter((step) => step.id !== stepId)
      // Reorder positions after deletion
      const reorderedSteps = updatedSteps.map((step, index) => ({
        ...step,
        position: index,
      }))
      setSteps(reorderedSteps)

      // Then update on the server
      await deleteStep(workflow.id.toString(), stepId.toString())
    } catch (err) {
      console.error("Error deleting step:", err)
      setError("An unexpected error occurred")
    }
  }

  const handleSaveWorkflow = async () => {
    if (!name.trim()) {
      setError("Workflow name is required")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const result = await updateWorkflow(workflow.id.toString(), {
        name,
        description,
      })

      if (result.success) {
        toast({
          title: "Workflow updated",
          description: "Your changes have been saved successfully.",
        })
        router.push(`/workflows/${workflow.id}`)
      } else {
        setError(result.error || "Failed to update workflow")
      }
    } catch (err) {
      console.error("Error updating workflow:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container py-10">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {error && <div className="p-4 border rounded-md bg-destructive/10 text-destructive mb-6">{error}</div>}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="steps">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mb-6">
                    {steps.map((step, index) => (
                      <Draggable key={step.id.toString()} draggableId={step.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="border rounded-md p-4 bg-card"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <EditStepItem
                                  step={step}
                                  users={users}
                                  onUpdate={handleUpdateStep}
                                  onDelete={() => handleDeleteStep(step.id)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <AddStepForm workflowId={workflow.id.toString()} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSaveWorkflow} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Workflow"}
          </Button>
        </div>
      </div>
    </div>
  )
}
