import { getUserGroups } from "../actions/chat-actions"
import { GroupSidebar } from "./group-sidebar"
import { ChatContainer } from "./chat-container"
import { getSession } from "@/lib/auth"
import { getCurrentUser } from "../login/actions"
import { notFound, redirect } from "next/navigation"
import { checkUserPermission } from "../actions/permission-actions"

export async function ChatLayout() {
  const groups = await getUserGroups()
  const session = await getSession()
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
    return
  }
  const perm = await checkUserPermission(currentUser.id, "/chat")
  if (perm.hasPermission === false) {
    return notFound()
  }
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

