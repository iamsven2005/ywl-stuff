"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { CreateGroupDialog } from "./create-group-dialog"
import { format, isToday, isYesterday } from "date-fns"
import { PlusCircle, Search, Filter, Loader2 } from "lucide-react"
import { searchGroups, getGroupsByMemberRole, getAvailableRoles } from "../actions/chat-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface User {
  id: number
  username: string
  email?: string | null
  role?: string[]
}

interface Message {
  id: number
  content: string
  createdAt: Date
  sender: {
    id: number
    username: string
  }
}

interface GroupMember {
  id: number
  userId: number
  user: User
}

interface Group {
  id: number
  name: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  members: GroupMember[]
  messages: Message[]
}

export function GroupSidebar({ groups: initialGroups }: { groups: Group[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentGroupId = searchParams.get("groupId")
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)

  useEffect(() => {
    setGroups(initialGroups)
  }, [initialGroups])

  useEffect(() => {
    fetchAvailableRoles()
  }, [])

  const fetchAvailableRoles = async () => {
    try {
      setIsLoadingRoles(true)
      const roles = await getAvailableRoles()
      setAvailableRoles(roles)
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    } finally {
      setIsLoadingRoles(false)
    }
  }

  const handleSelectGroup = (groupId: number) => {
    router.push(`/chat?groupId=${groupId}`)
  }

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setGroups(initialGroups)
      return
    }

    try {
      setIsSearching(true)
      const results = await searchGroups(searchQuery)
      setGroups(results)
    } catch (error) {
      console.error("Error searching groups:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleRoleFilter = async (role: string) => {
    setSelectedRole(role)

    try {
      setIsSearching(true)
      const results = await getGroupsByMemberRole(role)
      setGroups(results)
    } catch (error) {
      console.error("Error filtering groups by role:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Format date for last message
  const formatMessageDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "MMM d")
    }
  }

  // Get roles from group members
  const getGroupRoles = (group: Group) => {
    const roles = group.members.flatMap((member) => member.user.role || [])
    return [...new Set(roles)]
  }

  return (
    <div className="w-64 border-r flex flex-col dark:bg-gray-800 dark:border-gray-700">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="font-bold text-lg mb-2 dark:text-white">Chats</h2>
        <Button
          onClick={() => setIsCreateGroupOpen(true)}
          className="w-full mb-3 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
            <Input
              placeholder="Search chats..."
              className="pl-8 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            <Select value={selectedRole} onValueChange={handleRoleFilter} disabled={isLoadingRoles}>
              <SelectTrigger className="flex-1 h-8 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="all" className="dark:text-gray-200 dark:focus:bg-gray-700">
                  All roles
                </SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role} className="dark:text-gray-200 dark:focus:bg-gray-700">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isSearching ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground dark:text-gray-400" />
          </div>
        ) : (
          <div className="p-2">
            {groups.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground dark:text-gray-400">
                {searchQuery.length > 0 || selectedRole !== "all"
                  ? "No chats match your search criteria"
                  : "No chats yet. Create a new one to get started."}
              </div>
            ) : (
              groups.map((group) => {
                const isActive = currentGroupId === group.id.toString()
                const lastMessage = group.messages[0]
                const groupRoles = getGroupRoles(group)

                return (
                  <div
                    key={group.id}
                    className={`p-2 rounded-md cursor-pointer mb-1 ${
                      isActive ? "bg-primary/10 dark:bg-blue-900/30" : "hover:bg-muted/50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => handleSelectGroup(group.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="dark:bg-gray-700 dark:text-gray-200">
                          {getInitials(group.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium truncate dark:text-white">{group.name}</div>
                        {lastMessage && (
                          <div className="text-xs text-muted-foreground truncate dark:text-gray-400">
                            <span className="font-medium">{lastMessage.sender.username}:</span> {lastMessage.content}
                          </div>
                        )}
                        {groupRoles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {groupRoles.slice(0, 2).map((role) => (
                              <Badge
                                key={role}
                                variant="outline"
                                className="text-[10px] px-1 py-0 h-4 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                              >
                                {role}
                              </Badge>
                            ))}
                            {groupRoles.length > 2 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 h-4 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                              >
                                +{groupRoles.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      {lastMessage && (
                        <div className="text-xs text-muted-foreground whitespace-nowrap dark:text-gray-500">
                          {formatMessageDate(new Date(lastMessage.createdAt))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </ScrollArea>

      <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen} />
    </div>
  )
}

