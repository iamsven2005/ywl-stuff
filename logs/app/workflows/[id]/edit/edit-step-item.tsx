"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { AuditStep, User } from "../../types"

interface EditStepItemProps {
  step: AuditStep
  users: User[]
  onUpdate: (step: AuditStep) => void
  onDelete: () => void
}

export function EditStepItem({ step, users, onUpdate, onDelete }: EditStepItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [date, setDate] = useState<Date | undefined>(step.dueDate ? new Date(step.dueDate) : undefined)

  const handleStatusChange = (value: string) => {
    onUpdate({ ...step, status: value as any })
  }

  const handleAssigneeChange = (value: string) => {
    onUpdate({
      ...step,
      assignedToId: value === "unassigned" ? null : Number.parseInt(value),
    })
  }

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate)
    onUpdate({
      ...step,
      dueDate: newDate?.toISOString() || null,
    })
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <div>
            <Input
              value={step.title}
              onChange={(e) => onUpdate({ ...step, title: e.target.value })}
              className="font-medium border-0 p-0 h-auto focus-visible:ring-0"
              placeholder="Step title"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getStatusColor(step.status)} text-white`}>
            {step.status}
          </Badge>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 grid gap-4">
          <div className="space-y-2">
            <Label htmlFor={`description-${step.id}`}>Description</Label>
            <Textarea
              id={`description-${step.id}`}
              value={step.description || ""}
              onChange={(e) => onUpdate({ ...step, description: e.target.value })}
              placeholder="Step description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`status-${step.id}`}>Status</Label>
              <Select value={step.status} onValueChange={handleStatusChange}>
                <SelectTrigger id={`status-${step.id}`}>
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
              <Label htmlFor={`assignee-${step.id}`}>Assigned To</Label>
              <Select
                value={step.assignedToId ? step.assignedToId.toString() : "unassigned"}
                onValueChange={handleAssigneeChange}
              >
                <SelectTrigger id={`assignee-${step.id}`}>
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
                  <Calendar mode="single" selected={date} onSelect={handleDateChange} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
