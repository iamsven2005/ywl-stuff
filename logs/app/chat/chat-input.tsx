"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { sendMessage } from "../actions/chat-actions"
import { toast } from "sonner"
import { Loader2, Send, Paperclip, X } from "lucide-react"

export function ChatInput({ groupId }: { groupId: number }) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return

    try {
      setSending(true)

      if (selectedFile) {
        // Upload file first
        await uploadFile()
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

  const uploadFile = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("groupId", groupId.toString())

      const response = await fetch("/api/chat-upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        console.log(result)
        throw new Error(result || "Failed to upload file")
      }

      // If there's also a text message, send it as a follow-up
      if (message.trim()) {
        await sendMessage(groupId, message.trim())
      }

      // Reset state
      setMessage("")
      setSelectedFile(null)

      toast.success("File uploaded successfully")
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload file")
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
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit")
        return
      }

      setSelectedFile(file)
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="p-4 border-t bg-white">
      {selectedFile && (
        <div className="mb-2 p-2 bg-gray-100 rounded flex items-center justify-between">
          <div className="truncate text-sm">
            <span className="font-medium">Selected file:</span> {selectedFile.name}
          </div>
          <Button variant="ghost" size="icon" onClick={clearSelectedFile} disabled={sending || uploading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          placeholder="Type a message..."
          className="resize-none"
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
        />

        <Button
          variant="outline"
          size="icon"
          onClick={handleFileSelect}
          disabled={sending || uploading}
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleSendMessage}
          disabled={(!message.trim() && !selectedFile) || sending || uploading}
          size="icon"
        >
          {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

