"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle, Search, Users, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CreateGroupDialog } from "./create-group-dialog"
import { UsersListDialog } from "./users-list-dialog"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ManageMembersDialog } from "./manage-members-dialog"

interface Group {
  id: number
  name: string
  createdBy: string
  updatedAt: Date
  messages: {
    content: string
    sender: {
      username: string
    }
  }[]
  members?: {
    userId: number
  }[]
}

export function GroupSidebar({ groups }: { groups: Group[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentGroupId = searchParams.get("groupId")

  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isUsersListOpen, setIsUsersListOpen] = useState(false)
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<number | null>(null)

  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleGroupSelect = (groupId: number) => {
    router.push(`/chat?groupId=${groupId}`)
  }

  const handleManageMembers = (groupId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent group selection
    setSelectedGroupForMembers(groupId)
  }

  return (
    <div className="w-80 border-r border-gray-200 flex flex-col h-full bg-gray-50">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chats</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsUsersListOpen(true)} title="View all users">
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsCreateGroupOpen(true)} title="Create new group">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredGroups.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No conversations found</div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors ${
                currentGroupId === group.id.toString() ? "bg-gray-100" : ""
              }`}
              onClick={() => handleGroupSelect(group.id)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium truncate">{group.name}</h3>
                <div className="flex items-center gap-1">
                  {group.updatedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(group.updatedAt), { addSuffix: true })}
                    </span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleManageMembers(group.id, e)}>
                        Manage Members
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                {group.messages && group.messages[0] && (
                  <div className="text-sm text-muted-foreground truncate">
                    <span className="font-medium">{group.messages[0].sender.username}: </span>
                    {group.messages[0].content}
                  </div>
                )}
                {group.members && (
                  <div className="text-xs text-muted-foreground ml-2">{group.members.length} members</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} />
      <UsersListDialog open={isUsersListOpen} onOpenChange={setIsUsersListOpen} />
      {selectedGroupForMembers && (
        <ManageMembersDialog
          open={selectedGroupForMembers !== null}
          onOpenChange={(open) => !open && setSelectedGroupForMembers(null)}
          groupId={selectedGroupForMembers}
        />
      )}
    </div>
  )
}

