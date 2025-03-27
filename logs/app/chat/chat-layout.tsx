import { getUserGroups } from "../actions/chat-actions"
import { GroupSidebar } from "./group-sidebar"
import { ChatContainer } from "./chat-container"
import { getSession } from "@/lib/auth"

export async function ChatLayout() {
  const groups = await getUserGroups()
  const session = await getSession()

  if (!session?.user?.id) {
    throw new Error("User not authenticated")
  }
  const id = session?.user?.id
  return (
    <div className="flex h-full">
      <GroupSidebar groups={groups} />
      <ChatContainer id={id} />
    </div>
  )
}

