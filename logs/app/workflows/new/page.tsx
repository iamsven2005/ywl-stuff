"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AddStepForm } from "../add-step-form"
import { ArrowLeft, GripVertical } from "lucide-react"
import { createWorkflow, createStep, getUsers } from "../actions"
import type { AuditStep, User } from "../types"
import { toast } from "@/app/hooks/use-toast"
import { EditStepItem } from "../[id]/edit/edit-step-item"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"

export default function NewWorkflowPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [steps, setSteps] = useState<AuditStep[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await getUsers()
        if (result.success) {
          setUsers(result.data)
        }
      } catch (err) {
        console.error("Error fetching users:", err)
      }
    }

    fetchUsers()
  }, [])

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(steps)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }))

    setSteps(updatedItems)
  }

  const handleAddStep = (newStep: AuditStep) => {
    setSteps([...steps, { ...newStep, position: steps.length }])
  }

  const handleUpdateStep = (updatedStep: AuditStep) => {
    setSteps(steps.map((step) => (step.id === updatedStep.id ? updatedStep : step)))
  }

  const handleDeleteStep = (stepId: number) => {
    const updatedSteps = steps.filter((step) => step.id !== stepId)
    // Reorder positions after deletion
    const reorderedSteps = updatedSteps.map((step, index) => ({
      ...step,
      position: index,
    }))
    setSteps(reorderedSteps)
  }

  const handleCreateWorkflow = async () => {
    if (!name.trim()) {
      setError("Workflow name is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // First create the workflow
      const workflowResult = await createWorkflow({
        name,
        description,
      })

      if (!workflowResult.success) {
        setError(workflowResult.error || "Failed to create workflow")
        return
      }

      // Then add steps if there are any
      if (steps.length > 0) {
        for (const step of steps) {
          await createStep(workflowResult.data.id.toString(), {
            title: step.title,
            description: step.description,
            status: step.status,
            assignedToId: step.assignedToId ? step.assignedToId.toString() : null,
            dueDate: step.dueDate,
          })
        }
      }

      toast({
        title: "Workflow created",
        description: "Your new workflow has been created successfully.",
      })

      router.push("/workflows")
    } catch (err) {
      console.error("Error creating workflow:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
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
            <CardTitle>Create New Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter workflow name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter workflow description (optional)"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
          </CardHeader>
          <CardContent>
            {steps.length > 0 ? (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No steps added yet. Add your first step below.</p>
              </div>
            )}

            <AddStepForm workflowId="new-workflow" onAddStep={handleAddStep} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleCreateWorkflow} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Creating..." : "Create Workflow"}
          </Button>
        </div>
      </div>
    </div>
  )
}
