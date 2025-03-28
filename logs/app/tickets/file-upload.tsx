"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Paperclip } from "lucide-react"

interface FileUploadProps {
  ticketId?: number
  commentId?: number
  onUploadComplete?: (attachment: any) => void
  multiple?: boolean
  onFileSelect?: (files: File[]) => void
}

export function FileUpload({ ticketId, commentId, onUploadComplete, multiple = false, onFileSelect }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    // Convert FileList to array
    const filesArray = Array.from(e.target.files)

    // If onFileSelect is provided, call it and don't upload immediately
    if (onFileSelect) {
      onFileSelect(filesArray)
      return
    }

    // Otherwise, upload files immediately
    await uploadFiles(e.target.files)
  }

  const uploadFiles = async (files: FileList) => {
    // If neither ticketId nor commentId is provided and we're not using onFileSelect,
    // we can't upload the file yet
    if (!ticketId && !commentId && !onFileSelect) {
      toast.error("Cannot upload file yet. Please save the ticket or comment first.")
      return
    }

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds the 10MB size limit`)
          continue
        }

        const formData = new FormData()
        formData.append("file", file)

        if (ticketId) {
          formData.append("ticketId", ticketId.toString())
        }

        if (commentId) {
          formData.append("commentId", commentId.toString())
        }

        const response = await fetch("/api/ticket-upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to upload file")
        }

        const data = await response.json()

        if (onUploadComplete) {
          onUploadComplete(data.attachment)
        }

        toast.success(`File ${file.name} uploaded successfully`)
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload file")
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onFileSelect) {
        onFileSelect(Array.from(e.dataTransfer.files))
      } else {
        uploadFiles(e.dataTransfer.files)
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={`relative ${dragActive ? "bg-primary/10 border-primary" : ""}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        <Paperclip className="h-4 w-4" />
        {isUploading ? "Uploading..." : "Attach File"}
      </Button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple={multiple} />
    </div>
  )
}

