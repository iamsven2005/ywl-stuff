"use client"

import { AvatarFallback } from "@/components/ui/avatar"
import { Avatar } from "@/components/ui/avatar"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { updateTicket, addComment, deleteTicket, deleteComment } from "@/app/actions/ticket-actions"
import { formatDate } from "@/lib/utils"
import { FileUpload } from "../file-upload"
import { AttachmentList } from "../attachment-list"

// Status and priority options
const statusOptions = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
]

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
]

// Status badge colors
const statusColors: Record<string, string> = {
  open: "bg-blue-500 hover:bg-blue-600",
  in_progress: "bg-yellow-500 hover:bg-yellow-600",
  resolved: "bg-green-500 hover:bg-green-600",
  closed: "bg-gray-500 hover:bg-gray-600",
}

// Priority badge colors
const priorityColors: Record<string, string> = {
  low: "bg-gray-500 hover:bg-gray-600",
  medium: "bg-blue-500 hover:bg-blue-600",
  high: "bg-yellow-500 hover:bg-yellow-600",
  critical: "bg-red-500 hover:bg-red-600",
}

interface TicketDetailProps {
  ticket: any
  currentUser: any
  assignableUsers: any[]
}

export function TicketDetail({ ticket, currentUser, assignableUsers }: TicketDetailProps) {
  console.log(ticket)
  console.log(assignableUsers)
  const router = useRouter()
  const [status, setStatus] = useState(ticket.status)
  const [priority, setPriority] = useState(ticket.priority)
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo?.id?.toString() || "unassigned")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [ticketAttachments, setTicketAttachments] = useState(ticket.attachments || [])
  const [commentAttachments, setCommentAttachments] = useState<Record<number, any[]>>({})
  const [selectedCommentFiles, setSelectedCommentFiles] = useState<File[]>([])
  const commentIdRef = useRef<number | null>(null)

  const isAdmin = currentUser?.role?.includes("admin")
  const isCreator = currentUser?.id === ticket.createdBy.id
  const canEdit = isAdmin || isCreator

  useEffect(() => {
    // Initialize comment attachments
    const initialCommentAttachments: Record<number, any[]> = {}
    ticket.comments.forEach((comment: any) => {
      initialCommentAttachments[comment.id] = comment.TicketAttachment || []
    })
    setCommentAttachments(initialCommentAttachments)
  }, [ticket.comments])

  // Handle status change
  const handleStatusChange = async (value: string) => {
    try {
      setIsUpdating(true)
      setStatus(value)
      await updateTicket({
        id: ticket.id,
        status: value,
        assignedToId: assignedTo,
      })
      toast.success("Ticket status updated")
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update ticket status")
      setStatus(ticket.status) // Revert on error
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle priority change
  const handlePriorityChange = async (value: string) => {
    try {
      setIsUpdating(true)
      setPriority(value)
      await updateTicket({
        id: ticket.id,
        priority: value,
        assignedToId: assignedTo,
      })
      toast.success("Ticket priority updated")
    } catch (error) {
      console.error("Error updating priority:", error)
      toast.error("Failed to update ticket priority")
      setPriority(ticket.priority) // Revert on error
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle assignee change
  const handleAssigneeChange = async (value: string) => {
    try {
      setIsUpdating(true)
      setAssignedTo(value)
      console.log("Updating assignee to:", value)
      await updateTicket({
        id: ticket.id,
        assignedToId: value,
      })
      toast.success("Ticket assignee updated")
    } catch (error) {
      console.error("Error updating assignee:", error)
      toast.error("Failed to update ticket assignee")
      setAssignedTo(ticket.assignedTo?.id?.toString() || "unassigned") // Revert on error
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comment.trim() && selectedCommentFiles.length === 0) {
      toast.error("Please enter a comment or attach a file")
      return
    }

    setIsSubmitting(true)

    try {
      // Add the comment first
      const newComment = await addComment({
        ticketId: ticket.id,
        content: comment || "Attached file", // Use default text if no comment
      })

      // Store the comment ID for file uploads
      commentIdRef.current = newComment.id

      // Upload any selected files
      if (selectedCommentFiles.length > 0) {
        await uploadCommentFiles(selectedCommentFiles, newComment.id)
      }

      setComment("")
      setSelectedCommentFiles([])
      toast.success("Comment added")
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Upload files for a comment
  const uploadCommentFiles = async (files: File[], commentId: number) => {
    for (const file of files) {
      try {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds the 10MB size limit`)
          continue
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("commentId", commentId.toString())

        const response = await fetch("/api/ticket-upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to upload file")
        }

        const data = await response.json()

        // Update the UI with the new attachment
        setCommentAttachments((prev) => ({
          ...prev,
          [commentId]: [...(prev[commentId] || []), data.attachment],
        }))
      } catch (error) {
        console.error("Error uploading file:", error)
        toast.error(`Failed to upload file: ${file.name}`)
      }
    }
  }

  // Handle ticket deletion
  const handleDeleteTicket = async () => {
    setIsDeleting(true)

    try {
      await deleteTicket(ticket.id)
      toast.success("Ticket deleted")
      router.push("/tickets")
    } catch (error) {
      console.error("Error deleting ticket:", error)
      toast.error("Failed to delete ticket")
      setIsDeleting(false)
    }
  }

  // Handle comment deletion
  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId)
      toast.success("Comment deleted")
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  // Handle ticket attachment upload
  const handleTicketAttachmentUpload = (attachment: any) => {
    setTicketAttachments((prev: any) => [...prev, attachment])
  }

  // Handle comment attachment upload
  const handleCommentAttachmentUpload = (commentId: number, attachment: any) => {
    setCommentAttachments((prev) => ({
      ...prev,
      [commentId]: [...(prev[commentId] || []), attachment],
    }))
  }

  // Handle file selection for new comment
  const handleCommentFileSelect = (files: File[]) => {
    setSelectedCommentFiles((prev) => [...prev, ...files])
  }

  // Remove selected file for new comment
  const removeSelectedCommentFile = (index: number) => {
    setSelectedCommentFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Ticket #{ticket.id}: {ticket.title}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className={statusColors[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
            <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
            {ticket.relatedDevice && <Badge variant="outline">Device: {ticket.relatedDevice.name}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/tickets">Back to Tickets</Link>
          </Button>

          {isAdmin && (

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Ticket"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the ticket and all associated comments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTicket}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
                        )}

        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>

              {ticketAttachments.length > 0 && (
                <div className="mt-4">
                  <AttachmentList attachments={ticketAttachments} currentUserId={currentUser.id} isAdmin={isAdmin} />
                </div>
              )}
            </CardContent>
            {canEdit && (
              <CardFooter>
                <FileUpload ticketId={ticket.id} onUploadComplete={handleTicketAttachmentUpload} multiple />
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Comments ({ticket.comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.comments.length === 0 ? (
                <p className="text-muted-foreground">No comments yet.</p>
              ) : (
                ticket.comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{comment.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{comment.user.username}</span>
                          <span className="text-muted-foreground text-sm ml-2">
                            {formatDate(comment.createdAt, { hour: "numeric", minute: "numeric" })}
                          </span>
                        </div>
                        {(isAdmin || currentUser?.id === comment.user.id) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this comment? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{comment.content}</p>

                      {commentAttachments[comment.id]?.length > 0 && (
                        <div className="mt-2">
                          <AttachmentList
                            attachments={commentAttachments[comment.id]}
                            currentUserId={currentUser.id}
                            isAdmin={isAdmin}
                          />
                        </div>
                      )}

                      <div className="mt-2">
                        <FileUpload
                          commentId={comment.id}
                          onUploadComplete={(attachment) => handleCommentAttachmentUpload(comment.id, attachment)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter>
              <form onSubmit={handleCommentSubmit} className="w-full space-y-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />

                <div className="space-y-2">
                  {selectedCommentFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected files:</p>
                      <ul className="space-y-1">
                        {selectedCommentFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between p-2 text-sm border rounded-md">
                            <span className="truncate max-w-[250px]">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSelectedCommentFile(index)}
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

                <div className="flex justify-between items-center">
                  <FileUpload onFileSelect={handleCommentFileSelect} multiple />
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Add Comment"}
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Created By</p>
                <p>{ticket.createdBy.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created At</p>
                <p>{formatDate(ticket.createdAt, { hour: "numeric", minute: "numeric" })}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p>{formatDate(ticket.updatedAt, { hour: "numeric", minute: "numeric" })}</p>
              </div>
              <Button>
              <Link href={'/tickets/new'}>New Ticket</Link>
              </Button>
              {isAdmin && (
              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <Select value={status} onValueChange={handleStatusChange} disabled={!canEdit || isUpdating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm font-medium mb-1">Priority</p>
                <Select value={priority} onValueChange={handlePriorityChange} disabled={!canEdit || isUpdating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm font-medium mb-1">Assigned To</p>
                <Select value={assignedTo} onValueChange={handleAssigneeChange} disabled={!isAdmin || isUpdating}>
                  <SelectTrigger>
                    <SelectValue />
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
              </div>
              )}
            </CardContent>
          </Card>

          {ticket.relatedDevice && (
            <Card>
              <CardHeader>
                <CardTitle>Related Device</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p>{ticket.relatedDevice.name}</p>
                </div>
                {ticket.relatedDevice.ip_address && (
                  <div>
                    <p className="text-sm font-medium">IP Address</p>
                    <p>{ticket.relatedDevice.ip_address}</p>
                  </div>
                )}
                {ticket.relatedDevice.mac_address && (
                  <div>
                    <p className="text-sm font-medium">MAC Address</p>
                    <p>{ticket.relatedDevice.mac_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

