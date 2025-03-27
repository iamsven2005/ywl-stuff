"use client"

import { useSearchParams } from "next/navigation"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { MessageCircle } from "lucide-react"

export function ChatContainer({id}: {id: number}) {
  const searchParams = useSearchParams()
  const groupId = searchParams.get("groupId")

  if (!groupId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
          <p className="text-muted-foreground">Choose a conversation from the sidebar or create a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatMessages groupId={Number.parseInt(groupId) }    id={id} />
      <ChatInput groupId={Number.parseInt(groupId)} />
    </div>
  )
}

