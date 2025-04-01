"use client"

import { useState } from "react"
import { FileText, Image, File, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatBytes } from "@/lib/utils"
import { toast } from "sonner"
import { deleteAttachment } from "@/app/actions/ticket-actions"
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
import { TicketAttachment } from "@prisma/client"


interface AttachmentListProps {
  attachments: TicketAttachment[]
  currentUserId: number
  isAdmin: boolean
}

export function AttachmentList({ attachments, currentUserId, isAdmin }: AttachmentListProps) {
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({})

  if (!attachments || attachments.length === 0) {
    return null
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image className="h-4 w-4" />
    } else if (mimeType.includes("pdf")) {
      return <FileText className="h-4 w-4" />
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      return <FileText className="h-4 w-4" />
    } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      return <FileText className="h-4 w-4" />
    } else {
      return <File className="h-4 w-4" />
    }
  }

  const handleDelete = async (attachmentId: number) => {
    setIsDeleting((prev) => ({ ...prev, [attachmentId]: true }))

    try {
      await deleteAttachment(attachmentId)
      toast.success("Attachment deleted successfully")
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast.error("Failed to delete attachment")
    } finally {
      setIsDeleting((prev) => ({ ...prev, [attachmentId]: false }))
    }
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Attachments ({attachments.length})</h4>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center justify-between p-2 rounded-md border bg-background">
            <div className="flex items-center gap-2 overflow-hidden">
              {getFileIcon(attachment.mimeType)}
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{attachment.originalFilename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(attachment.fileSize)} • Uploaded by {attachment.uploaderId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <a href={`/api/ticket-document/${attachment.id}`} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>

              {(isAdmin || currentUserId === attachment.uploaderId) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      disabled={isDeleting[attachment.id]}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this attachment? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(attachment.id)}>
                        {isDeleting[attachment.id] ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

