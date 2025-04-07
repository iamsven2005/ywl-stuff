"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadFile } from "../actions/drive-actions"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface UploadButtonProps {
  folderId: number | null
  onUploadComplete: () => Promise<void>
}

export function UploadButton({ folderId, onUploadComplete }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 100)

      const formData = new FormData()
      formData.append("file", files[0])
      formData.append("folderId", folderId?.toString() || "")

      await uploadFile(formData)

      clearInterval(progressInterval)
      setProgress(100)

      toast.success("File uploaded successfully")
      await onUploadComplete()

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      toast.error("Failed to upload file")
      console.error(error)
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setProgress(0)
      }, 500)
    }
  }

  return (
    <div>
      <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" disabled={isUploading} />
      <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
        <Upload className="h-4 w-4 mr-2" />
        Upload
      </Button>

      {isUploading && (
        <div className="mt-2 w-40">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{progress === 100 ? "Processing..." : "Uploading..."}</p>
        </div>
      )}
    </div>
  )
}

