"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { sendMessage } from "../actions/chat-actions"
import { toast } from "sonner"
import { Loader2, Send, Paperclip, X, Upload } from "lucide-react"

export function ChatInput({ groupId }: { groupId: number }) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return

    try {
      setSending(true)

      if (selectedFiles.length > 0) {
        // Upload files first
        await uploadFiles()
      } else {
        // Just send text message
        await sendMessage(groupId, message.trim())
        setMessage("")
      }
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    try {
      setUploading(true)

      // Upload each file sequentially
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("groupId", groupId.toString())

        const response = await fetch("/api/chat-upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || `Failed to upload file: ${file.name}`)
        }
      }

      // If there's also a text message, send it as a follow-up
      if (message.trim()) {
        await sendMessage(groupId, message.trim())
      }

      // Reset state
      setMessage("")
      setSelectedFiles([])
f
      toast.success(
        selectedFiles.length === 1
          ? "File uploaded successfully"
          : `${selectedFiles.length} files uploaded successfully`,
      )
    } catch (error) {
      console.error("Error uploading files:", error)
      toast.error("Failed to upload one or more files")
    } finally {
      setUploading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(Array.from(files))
    }
  }

  const processFiles = (files: File[]) => {
    // Filter out files that exceed size limit
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    for (const file of files) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(file.name)
      } else {
        validFiles.push(file)
      }
    }

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) exceed the 10MB size limit`)
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const clearAllFiles = () => {
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length === 0) return

    processFiles(Array.from(files))
  }, [])

  // Handle clipboard paste events
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Only process if the paste target is our textarea or a child of our component
      if (!dropZoneRef.current?.contains(e.target as Node) && e.target !== textareaRef.current) {
        return
      }

      // Check for files in clipboard data
      const items = e.clipboardData?.items
      if (!items) return

      const files: File[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        // Check if the clipboard item is a file
        if (item.kind === "file") {
          const file = item.getAsFile()
          if (file) {
            files.push(file)
          }
        }
      }

      // Check for images in clipboard
      if (files.length === 0 && navigator.clipboard && navigator.clipboard.read) {
        try {
          const clipboardItems = await navigator.clipboard.read()

          for (const clipboardItem of clipboardItems) {
            // Check for image types
            for (const type of clipboardItem.types) {
              if (type.startsWith("image/")) {
                const blob = await clipboardItem.getType(type)
                // Create a file from the blob
                const filename = `pasted-image-${new Date().getTime()}.${type.split("/")[1] || "png"}`
                const file = new File([blob], filename, { type })
                files.push(file)
              }
            }
          }
        } catch (err) {
          // Clipboard API read permission denied or not supported
          console.warn("Could not access clipboard images:", err)
        }
      }

      if (files.length > 0) {
        e.preventDefault() // Prevent default paste behavior if we found files
        processFiles(files)
      }
    }

    // Add the event listener to the document
    document.addEventListener("paste", handlePaste)

    // Clean up
    return () => {
      document.removeEventListener("paste", handlePaste)
    }
  }, [])

  return (
    <div
      ref={dropZoneRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`p-4 border-t bg-white dark:bg-gray-800 dark:border-gray-700 transition-colors ${
        isDragging ? "bg-primary/5 dark:bg-blue-900/20" : ""
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-black/40 z-10 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <Upload className="h-12 w-12 mx-auto mb-2 text-primary dark:text-blue-400" />
            <p className="text-lg font-medium dark:text-white">Drop files to upload</p>
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mb-2 p-2 bg-gray-100 rounded dark:bg-gray-700">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium dark:text-gray-200">
              {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              disabled={sending || uploading}
              className="h-6 px-2 text-xs dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Clear all
            </Button>
          </div>
          <div className="max-h-24 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-1 border-t first:border-0 dark:border-gray-600"
              >
                <div className="truncate text-sm dark:text-gray-200 flex-1">
                  {file.name}
                  {file.type.startsWith("image/") && (
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(Image)</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={sending || uploading}
                  className="h-6 w-6 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message or paste files..."
          className="resize-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:placeholder:text-gray-400"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending || uploading}
          rows={1}
        />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          multiple
        />

        <Button
          variant="outline"
          size="icon"
          onClick={handleFileSelect}
          disabled={sending || uploading}
          title="Attach files"
          className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleSendMessage}
          disabled={(!message.trim() && selectedFiles.length === 0) || sending || uploading}
          size="icon"
          className="dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

