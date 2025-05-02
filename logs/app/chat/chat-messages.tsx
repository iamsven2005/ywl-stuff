"use client"

import { useEffect, useState, useRef } from "react"
import { getGroupMessages, getGroupWithMembers, deleteMessage, editMessage } from "../actions/chat-actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import {
  Loader2,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  FileText,
  ImageIcon,
  File,
  Download,
} from "lucide-react"
import { ManageMembersDialog } from "./manage-members-dialog"
import { MessageSearch } from "./message-search"
import { PollMessage } from "./poll-message"
import { toast } from "sonner"

interface Message {
  id: number
  content: string
  senderId: number
  groupId: number
  createdAt: Date
  edited?: boolean
  isPoll?: boolean
  fileAttachment?: string | null
  fileOriginalName?: string | null
  fileType?: string | null
  sender: {
    id: number
    username: string
    email?: string | null
  }
}

export function ChatMessages({ groupId, id }: { groupId: number; id: number }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [groupName, setGroupName] = useState("")
  const [memberCount, setMemberCount] = useState(0)
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  const fetchMessages = async () => {
    try {
      const fetchedMessages = await getGroupMessages(groupId)
      setMessages(fetchedMessages)

      // Get group details including member count
      const group = await getGroupWithMembers(groupId)
      if (group) {
        setGroupName(group.name)
        setMemberCount(group.members.length)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchMessages()
      setLoading(false)
    }

    loadData()

    // Set up polling for new messages
    const intervalId = setInterval(fetchMessages, 3000)

    return () => clearInterval(intervalId)
  }, [groupId])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (!editingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, editingMessageId])

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId)
      toast.success("Message deleted")
      // Optimistically update UI
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    } catch (error) {
      toast.error("Failed to delete message")
    }
  }

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id)
    setEditedContent(message.content)
  }

  const handleSaveEdit = async () => {
    if (!editingMessageId) return

    try {
      await editMessage(editingMessageId, editedContent)
      toast.success("Message updated")

      // Optimistically update UI
      setMessages((prev) =>
        prev.map((msg) => (msg.id === editingMessageId ? { ...msg, content: editedContent, edited: true } : msg)),
      )

      setEditingMessageId(null)
      setEditedContent("")
    } catch (error) {
      toast.error("Failed to update message")
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditedContent("")
  }

  const scrollToMessage = (messageId: number) => {
    const messageElement = messageRefs.current[messageId]
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" })
      // Highlight the message temporarily
      messageElement.classList.add("bg-yellow-100")
      setTimeout(() => {
        messageElement.classList.remove("bg-yellow-100")
      }, 2000)
    }
  }

  // Get file icon based on file type
  const getFileIcon = (fileType: string | null, fileName: string | null) => {
    if (!fileType && !fileName) return <File className="h-5 w-5" />

    if (fileType?.startsWith("image/") || fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <ImageIcon className="h-5 w-5" />
    }

    if (fileType?.includes("pdf") || fileName?.endsWith(".pdf")) {
      return <FileText className="h-5 w-5" />
    }

    return <File className="h-5 w-5" />
  }

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {}
  messages.forEach((message) => {
    const date = new Date(message.createdAt).toLocaleDateString()
    if (!groupedMessages[date]) {
      groupedMessages[date] = []
    }
    groupedMessages[date].push(message)
  })

  // Get initials from username
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }
  const parseWhatsAppStyle = (text: string) => {
    const escapeHtml = (unsafe: string) =>
      unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")

    const escaped = escapeHtml(text)

    // Apply WhatsApp-style formatting
    const formatted = escaped
      .replace(/\*(.*?)\*/g, "<strong>$1</strong>") // *bold*
      .replace(/_(.*?)_/g, "<em>$1</em>") // _italic_
      .replace(/~(.*?)~/g, "<s>$1</s>") // ~strikethrough~
      .replace(/`(.*?)`/g, "<code class='bg-gray-100 px-1 rounded text-sm'>$1</code>") // `code`

    // Convert links
    const withLinks = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline text-blue-500 hover:text-blue-700">${url}</a>`,
    )

    return withLinks
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b p-4 flex justify-between items-center">
        <h2 className="font-bold text-lg">{groupName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={() => setIsSearchOpen(true)}>
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsManageMembersOpen(true)}
          >
            <Users className="h-4 w-4" />
            <span>{memberCount} members</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(groupedMessages).length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date} className="mb-6">
                <div className="text-xs text-center text-muted-foreground mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded-full">
                    {new Date(date).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {dateMessages.map((message) => {
                  const isCurrentUser = message.sender.id === id
                  const hasFileAttachment = !!message.fileAttachment
                  const isPoll = !!message.isPoll

                  return (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      ref={(el) => {
                        messageRefs.current[message.id] = el
                      }}
                    >
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8 mr-2 mt-1">
                          <AvatarFallback>{getInitials(message.sender.username)}</AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`max-w-[75%] ${isCurrentUser ? "text-right" : ""}`}>
                        {!isCurrentUser && (
                          <div className="text-xs text-muted-foreground mb-1">{message.sender.username}</div>
                        )}

                        <div className="flex items-start gap-1">
                          {isCurrentUser && editingMessageId === message.id ? (
                            <div className="flex flex-col gap-2 w-full">
                              <Textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="min-h-[60px] p-2"
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={!editedContent.trim() || editedContent === message.content}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className={`rounded-lg p-3 transition-colors ${
                                  isCurrentUser ? "bg-primary text-primary-foreground ml-auto" : "bg-gray-100"
                                }`}
                              >
                                {isPoll ? (
                                  <PollMessage messageId={message.id} userId={id} />
                                ) : (
                                  <>
                                    <div className="break-words whitespace-pre-wrap">
                                      <p
                                        className="break-words"
                                        dangerouslySetInnerHTML={{ __html: parseWhatsAppStyle(message.content) }}
                                      />
                                    </div>

                                    {hasFileAttachment && (
                                      <div
                                        className={`mt-2 p-2 rounded-md ${isCurrentUser ? "bg-blue-700" : "bg-gray-200"}`}
                                      >
                                        <a
                                          href={`/api/chat-document/${message.fileAttachment}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2"
                                        >
                                          {getFileIcon(message.fileType ?? null, message.fileOriginalName ?? null)}
                                          <span className="text-sm truncate max-w-[200px]">
                                            {message.fileOriginalName || "Attachment"}
                                          </span>
                                          <Download
                                            className={`h-4 w-4 ${isCurrentUser ? "text-white" : "text-gray-600"}`}
                                          />
                                        </a>
                                      </div>
                                    )}
                                  </>
                                )}

                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className="text-xs opacity-70">
                                    {format(new Date(message.createdAt), "h:mm a")}
                                  </span>
                                  {message.edited && <span className="text-xs opacity-70">(edited)</span>}
                                </div>
                              </div>

                              {isCurrentUser && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!hasFileAttachment && !isPoll && (
                                      <DropdownMenuItem onClick={() => handleEditMessage(message)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <ManageMembersDialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen} groupId={groupId} />

      <MessageSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        groupId={groupId}
        onMessageSelect={scrollToMessage}
      />
    </div>
  )
}
