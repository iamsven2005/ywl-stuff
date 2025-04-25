"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUsers, createStep } from "./actions"
import type { AuditStep, User } from "./types"

interface AddStepFormProps {
  workflowId: string
  onAddStep: (step: AuditStep) => void
}

export function AddStepForm({ workflowId, onAddStep }: AddStepFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<string>("PENDING")
  const [assignedToId, setAssignedToId] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [users, setUsers] = useState<User[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    if (isAdding) {
      fetchUsers()
    }
  }, [isAdding])

  const handleAddStep = async () => {
    if (!title.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createStep(workflowId, {
        title,
        description: description || undefined,
        status,
        assignedToId: assignedToId,
        dueDate: date?.toISOString() || undefined,
      })

      if (result.success) {
        onAddStep(result.data)
        resetForm()
      } else {
        setError(result.error || "Failed to add step")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setStatus("PENDING")
    setAssignedToId(null)
    setDate(undefined)
    setIsAdding(false)
    setError(null)
  }

  if (!isAdding) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Step
      </Button>
    )
  }

  return (
    <div className="border rounded-md p-4 space-y-4">
      <h3 className="font-medium">Add New Step</h3>

      {error && <div className="p-2 text-sm border rounded-md bg-destructive/10 text-destructive">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="new-step-title">Title</Label>
        <Input id="new-step-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Step title" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-step-description">Description</Label>
        <Textarea
          id="new-step-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Step description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="new-step-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="new-step-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-step-assignee">Assigned To</Label>
          <Select value={assignedToId || ""} onValueChange={(value) => setAssignedToId(value === "" ? null : value)}>
            <SelectTrigger id="new-step-assignee">
              <SelectValue placeholder="Assign to user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.username || user.email || `User ${user.id}`} ({user.role.join(", ")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleAddStep} disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? "Adding..." : "Add Step"}
        </Button>
      </div>
    </div>
  )
}
