"use client"

import type React from "react"

import { useState } from "react"
import { searchMessages } from "../actions/chat-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, X } from "lucide-react"
import { format } from "date-fns"

interface Message {
  id: number
  content: string
  createdAt: Date
  sender: {
    id: number
    username: string
    email?: string | null
  }
}

export function MessageSearch({
  groupId,
  open,
  onOpenChange,
  onMessageSelect,
}: {
  groupId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onMessageSelect: (messageId: number) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Message[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim() || query.length < 2) return

    try {
      setSearching(true)
      const messages = await searchMessages(groupId, query.trim())
      setResults(messages)
    } catch (error) {
      console.error("Failed to search messages:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
  }

  const handleMessageClick = (messageId: number) => {
    onMessageSelect(messageId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>

        <div className="flex items-center space-x-2 mt-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-8"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={!query.trim() || query.length < 2 || searching} size="sm">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
        </div>

        <div className="mt-4 max-h-[300px] overflow-y-auto">
          {searching ? (
            <div className="text-center py-4 text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            query ? (
              <div className="text-center py-4 text-muted-foreground">No messages found</div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">Enter a search term to find messages</div>
            )
          ) : (
            <div className="space-y-3">
              {results.map((message) => (
                <button
                  key={message.id}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={() => handleMessageClick(message.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{message.sender.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{message.sender.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2">{message.content}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

