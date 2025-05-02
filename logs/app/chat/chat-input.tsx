"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { sendMessage } from "../actions/chat-actions"
import { toast } from "sonner"
import { Loader2, Send, Paperclip, X, Upload, Command, BarChart3 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PollCreator } from "./poll-creator"

// Define slash commands
interface SlashCommand {
  command: string
  description: string
  icon: React.ReactNode
  action: () => string | Promise<string> | void
}

export function ChatInput({ groupId, userId }: { groupId: number; userId: number }) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showCommands, setShowCommands] = useState(false)
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([])
  const [commandInput, setCommandInput] = useState("")
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [showPollCreator, setShowPollCreator] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const commandsRef = useRef<HTMLDivElement>(null)

  // Define available slash commands
  const slashCommands: SlashCommand[] = [
    {
      command: "/poll",
      description: "Create a voting poll",
      icon: (
        <span className="text-blue-500 mr-2">
          <BarChart3 className="h-4 w-4" />
        </span>
      ),
      action: () => {
        setShowPollCreator(true)
        setShowCommands(false)
        setMessage("")
      },
    },
    {
      command: "/password",
      description: "Generate a secure random password",
      icon: <span className="text-blue-500 mr-2">🔑</span>,
      action: () => {
        const length = 12
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?"
        let password = ""
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length)
          password += charset[randomIndex]
        }
        return `Generated password: \`${password}\``
      },
    },
    {
      command: "/time",
      description: "Insert current date and time",
      icon: <span className="text-green-500 mr-2">🕒</span>,
      action: () => {
        return `Current time: ${new Date().toLocaleString()}`
      },
    },
    {
      command: "/shrug",
      description: "Insert shrug emoticon",
      icon: <span className="text-yellow-500 mr-2">😏</span>,
      action: () => {
        return "¯\\_(ツ)_/¯"
      },
    },
    {
      command: "/tableflip",
      description: "Insert table flip emoticon",
      icon: <span className="text-red-500 mr-2">😠</span>,
      action: () => {
        return "(╯°□°)╯︵ ┻━┻"
      },
    },
    {
      command: "/unflip",
      description: "Insert table unflip emoticon",
      icon: <span className="text-purple-500 mr-2">😌</span>,
      action: () => {
        return "┬─┬ノ( º _ ºノ)"
      },
    },
    {
      command: "/lorem",
      description: "Insert lorem ipsum text",
      icon: <span className="text-gray-500 mr-2">📝</span>,
      action: () => {
        return "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
      },
    },
    {
      command: "/dice",
      description: "Roll a dice (1-6)",
      icon: <span className="text-indigo-500 mr-2">🎲</span>,
      action: () => {
        const roll = Math.floor(Math.random() * 6) + 1
        return `🎲 You rolled a ${roll}`
      },
    },
    {
      command: "/coin",
      description: "Flip a coin (heads/tails)",
      icon: <span className="text-amber-500 mr-2">🪙</span>,
      action: () => {
        return Math.random() > 0.5 ? "Coin flip: Heads" : "Coin flip: Tails"
      },
    },
  ]

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
    if (showCommands) {
      // Handle command selection with arrow keys
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedCommandIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        executeCommand(filteredCommands[selectedCommandIndex])
      } else if (e.key === "Escape") {
        e.preventDefault()
        setShowCommands(false)
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key === "/" && message === "") {
      // Show commands when typing / at the beginning
      setCommandInput("")
      setShowCommands(true)
      setSelectedCommandIndex(0)
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setMessage(newValue)

    // Check for slash commands
    if (newValue.startsWith("/")) {
      const commandText = newValue.slice(1)
      setCommandInput(commandText)

      // Filter commands based on input
      const filtered = slashCommands.filter((cmd) =>
        cmd.command.slice(1).toLowerCase().includes(commandText.toLowerCase()),
      )

      setFilteredCommands(filtered)
      setSelectedCommandIndex(0)
      setShowCommands(filtered.length > 0)
    } else {
      setShowCommands(false)
    }
  }

  const executeCommand = async (command: SlashCommand) => {
    try {
      const result = await command.action()
      if (typeof result === "string") {
        setMessage(result)
      }
      setShowCommands(false)
      // Focus the textarea after executing command
      textareaRef.current?.focus()
    } catch (error) {
      console.error(`Error executing command ${command.command}:`, error)
      toast.error(`Failed to execute ${command.command}`)
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

  // Update filtered commands when command input changes
  useEffect(() => {
    if (commandInput !== "") {
      const filtered = slashCommands.filter((cmd) =>
        cmd.command.slice(1).toLowerCase().includes(commandInput.toLowerCase()),
      )
      setFilteredCommands(filtered)
      setShowCommands(filtered.length > 0)
    } else {
      setFilteredCommands(slashCommands)
    }
  }, [commandInput])

  // Initialize filtered commands
  useEffect(() => {
    setFilteredCommands(slashCommands)
  }, [])

  const handlePollCreated = (pollId: number) => {
    toast.success("Poll created successfully")
    setShowPollCreator(false)
  }

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

      {showPollCreator && (
        <div className="mb-4">
          <PollCreator
            groupId={groupId}
            senderId={userId}
            onClose={() => setShowPollCreator(false)}
            onSuccess={handlePollCreated}
          />
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

      <div className="flex gap-2 relative">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message, paste files, or type / for commands..."
          className="resize-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:placeholder:text-gray-400"
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          disabled={sending || uploading || showPollCreator}
          rows={1}
        />

        {showCommands && filteredCommands.length > 0 && (
          <div
            ref={commandsRef}
            className="absolute bottom-full left-0 w-full max-w-md bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg z-10 mb-1 max-h-60 overflow-y-auto"
          >
            <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0">
              <div className="flex items-center">
                <Command className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium">Commands</span>
              </div>
            </div>
            <div>
              {filteredCommands.map((cmd, index) => (
                <div
                  key={cmd.command}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center ${
                    index === selectedCommandIndex ? "bg-gray-100 dark:bg-gray-700" : ""
                  }`}
                  onClick={() => executeCommand(cmd)}
                >
                  {cmd.icon}
                  <div>
                    <div className="font-medium text-sm">{cmd.command}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          multiple
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={sending || uploading || showPollCreator}
              title="Commands"
              className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <Command className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="text-sm font-medium">Available Commands</div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {slashCommands.map((cmd) => (
                <div
                  key={cmd.command}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                  onClick={() => {
                    if (cmd.command === "/poll") {
                      executeCommand(cmd)
                    } else {
                      setMessage(cmd.command + " ")
                      textareaRef.current?.focus()
                    }
                  }}
                >
                  {cmd.icon}
                  <div>
                    <div className="font-medium text-sm">{cmd.command}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{cmd.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          onClick={handleFileSelect}
          disabled={sending || uploading || showPollCreator}
          title="Attach files"
          className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleSendMessage}
          disabled={(!message.trim() && selectedFiles.length === 0) || sending || uploading || showPollCreator}
          size="icon"
          className="dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
