import { Suspense } from "react"
import { ChatLayout } from "./chat-layout"
import { ChatSkeleton } from "./chat-skeleton"

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <Suspense fallback={<ChatSkeleton />}>
        <ChatLayout />
      </Suspense>
    </div>
  )
}

