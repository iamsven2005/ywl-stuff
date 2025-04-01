"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createTicket } from "@/app/actions/ticket-actions"
import { FileUpload } from "../file-upload"

export function NewTicketForm({
  deviceNames,
  assignableUsers,
  isAdmin
}: {
  deviceNames: string[]
  assignableUsers: { id: number; username: string }[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [relatedDevice, setRelatedDevice] = useState<string>("")
  const [assignedToId, setAssignedToId] = useState<string>("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a description")
      return
    }

    setIsSubmitting(true)

    try {
      // Find device ID if a device is selected
      const relatedDeviceId: number | null = null
      if (relatedDevice && relatedDevice !== "none") {
        // This would need to be updated to get the actual device ID
        // For now, we'll just use null
      }

      const ticket = await createTicket({
        title,
        description,
        priority,
        relatedDeviceId,
        assignedToId: assignedToId ? Number(assignedToId) : undefined,
      })

      // Now that we have a ticket ID, upload any selected files
      if (selectedFiles.length > 0) {
        await uploadFiles(selectedFiles, ticket.id)
      }

      toast.success("Ticket created successfully")
      router.push(`/tickets/${ticket.id}`)
    } catch (error) {
      toast.error("Failed to create ticket")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files])
    toast.success(`${files.length} file(s) selected for upload`)
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (files: File[], ticketId: number) => {
    for (const file of files) {
      try {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds the 10MB size limit`)
          continue
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("ticketId", ticketId.toString())

        const response = await fetch("/api/ticket-upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to upload file")
        }
      } catch (error) {
        console.error("Error uploading file:", error)
        toast.error(`Failed to upload file: ${file.name}`)
      }
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>New Support Ticket</CardTitle>
        <CardDescription>Fill out the form below to create a new support ticket</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the issue"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select the appropriate priority level for your issue</p>

            <Label htmlFor="assignee">Assign To (Optional)</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an assignee (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {assignableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="device">Related Device (Optional)</Label>
            <Select value={relatedDevice} onValueChange={setRelatedDevice}>
              <SelectTrigger>
                <SelectValue placeholder="Select a device (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {deviceNames.map((device) => (
                  <SelectItem key={device} value={device}>
                    {device}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
                      )}
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <div className="mt-2">
              <FileUpload onFileSelect={handleFileSelect} multiple />
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-sm font-medium">Selected files:</p>
                <ul className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-2 text-sm border rounded-md">
                      <span className="truncate max-w-[250px]">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSelectedFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        ✕
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.push("/tickets")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Ticket"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

