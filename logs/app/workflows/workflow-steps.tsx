"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, GripVertical } from "lucide-react"
import { StepDetail } from "./step-detail"
import { getStepsByWorkflowId, reorderSteps, updateStep, getUsers } from "./actions"
import type { AuditStep, User } from "./types"
import { WorkflowStepsSkeleton } from "./workflow-steps-skeleton"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"

export function WorkflowSteps({ workflowId }: { workflowId: string }) {
  const [steps, setSteps] = useState<AuditStep[]>([])
  const [filteredSteps, setFilteredSteps] = useState<AuditStep[]>([])
  const [selectedStep, setSelectedStep] = useState<AuditStep | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch steps
        const stepsResult = await getStepsByWorkflowId(workflowId)
        if (stepsResult.success) {
          setSteps(stepsResult.data)
          setFilteredSteps(stepsResult.data)
          if (stepsResult.data.length > 0 && !selectedStep) {
            setSelectedStep(stepsResult.data[0])
          }
        } else {
          setError(stepsResult.error || "Failed to load steps")
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
  }, [workflowId])

  // Update filtered steps when search query changes
  useEffect(() => {
    if (!steps.length) return

    if (!searchQuery.trim()) {
      setFilteredSteps(steps)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = steps.filter(
      (step) =>
        step.title.toLowerCase().includes(query) ||
        (step.description && step.description.toLowerCase().includes(query)),
    )
    setFilteredSteps(filtered)
  }, [searchQuery, steps])

  // Ensure selectedStep is updated when steps change
  useEffect(() => {
    if (selectedStep && steps.length) {
      const currentStep = steps.find((step) => step.id === selectedStep.id)
      if (currentStep) {
        setSelectedStep(currentStep)
      }
    }
  }, [steps, selectedStep])

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

    // Update filtered steps as well
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = updatedItems.filter(
        (step) =>
          step.title.toLowerCase().includes(query) ||
          (step.description && step.description.toLowerCase().includes(query)),
      )
      setFilteredSteps(filtered)
    } else {
      setFilteredSteps(updatedItems)
    }

    // Then update on the server
    try {
      const stepIds = updatedItems.map((step) => step.id.toString())
      const result = await reorderSteps(workflowId, stepIds)

      if (!result.success) {
        // If server update fails, revert to original order
        setError("Failed to reorder steps: " + result.error)
        const originalSteps = await getStepsByWorkflowId(workflowId)
        if (originalSteps.success) {
          setSteps(originalSteps.data)
          setFilteredSteps(originalSteps.data)
        }
      }
    } catch (err) {
      setError("An unexpected error occurred while reordering steps")
      console.error(err)
    }
  }

  const handleStepSelect = (step: AuditStep) => {
    setSelectedStep(step)
  }

  const handleStepUpdate = async (updatedStep: AuditStep) => {
    try {
      // Update locally first for immediate UI feedback
      const updatedSteps = steps.map((s) => (s.id === updatedStep.id ? updatedStep : s))
      setSteps(updatedSteps)
      setSelectedStep(updatedStep)

      // Then update on the server
      const result = await updateStep(workflowId, updatedStep.id.toString(), updatedStep)

      if (!result.success) {
        setError("Failed to update step: " + result.error)
        // Revert to original data if server update fails
        const stepsResult = await getStepsByWorkflowId(workflowId)
        if (stepsResult.success) {
          setSteps(stepsResult.data)
          setFilteredSteps(stepsResult.data)
          const currentStep = stepsResult.data.find((s) => s.id === updatedStep.id)
          if (currentStep) {
            setSelectedStep(currentStep)
          }
        }
      }
    } catch (err) {
      setError("An unexpected error occurred while updating the step")
      console.error(err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500"
      case "IN_PROGRESS":
        return "bg-blue-500"
      case "REVIEW":
        return "bg-purple-500"
      case "COMPLETED":
        return "bg-green-500"
      case "REJECTED":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return <WorkflowStepsSkeleton />
  }

  if (error) {
    return <div className="p-4 border rounded-md bg-destructive/10 text-destructive">Error: {error}</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Workflow Steps</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search steps..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="steps">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {filteredSteps.map((step, index) => (
                      <Draggable key={step.id.toString()} draggableId={step.id.toString()} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-md p-4 bg-card hover:bg-accent/50 cursor-pointer ${
                              selectedStep?.id === step.id ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => handleStepSelect(step)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                >
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="font-medium">{step.title}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {step.description || "No description"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {step.assignedToId && (
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback>
                                      {users.find((u) => u.id === step.assignedToId)?.username?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <Badge variant="outline" className={`${getStatusColor(step.status)} text-white`}>
                                  {step.status}
                                </Badge>
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

            {filteredSteps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? (
                  <p>No steps match your search. Try a different query.</p>
                ) : (
                  <p>No steps found in this workflow.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div>
        {selectedStep ? (
          <StepDetail
            step={selectedStep}
            workflowId={workflowId}
            onClose={() => setSelectedStep(null)}
            onUpdate={handleStepUpdate}
            users={users}
          />
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">Select a step to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
