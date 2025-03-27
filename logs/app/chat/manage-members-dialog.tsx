"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getGroupWithMembers, removeUserFromGroup, searchUsers, addUserToGroup } from "../actions/chat-actions"
import { toast } from "sonner"
import { Loader2, Search, UserPlus, X, Shield } from "lucide-react"

interface UserType {
  id: number
  username: string
  email?: string | null
  role?: string[]
}

interface GroupMemberType {
  id: number
  userId: number
  user: UserType
}

export function ManageMembersDialog({
  open,
  onOpenChange,
  groupId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: number
}) {
  const [members, setMembers] = useState<GroupMemberType[]>([])
  const [groupName, setGroupName] = useState("")
  const [createdBy, setCreatedBy] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserType[]>([])
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState("current")

  useEffect(() => {
    if (open && groupId) {
      fetchGroupMembers()
    }
  }, [open, groupId])

  const fetchGroupMembers = async () => {
    try {
      setLoading(true)
      const group = await getGroupWithMembers(groupId)
      if (group) {
        setMembers(group.members)
        setGroupName(group.name)
        setCreatedBy(group.createdBy)
      }
    } catch (error) {
      toast.error("Failed to fetch group members")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId: number) => {
    try {
      await removeUserFromGroup(groupId, userId)
      toast.success("User removed from group")
      fetchGroupMembers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove user")
    }
  }

  const handleSearchUsers = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const results = await searchUsers(searchQuery)
      // Filter out users who are already members
      const memberUserIds = members.map((member) => member.userId)
      const filteredResults = results.filter((user) => !memberUserIds.includes(user.id))
      setSearchResults(filteredResults)
    } catch (error) {
      toast.error("Failed to search users")
    } finally {
      setSearching(false)
    }
  }

  const handleAddUser = async (userId: number) => {
    try {
      await addUserToGroup(groupId, userId)
      toast.success("User added to group")
      fetchGroupMembers()
      setActiveTab("current")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add user")
    }
  }

  // Get initials from username
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Group Members</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Members</TabsTrigger>
            <TabsTrigger value="add">Add Members</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium">{groupName}</h3>
              <p className="text-sm text-muted-foreground">Created by {createdBy}</p>
            </div>

            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-60 border rounded-md">
                <div className="p-2 space-y-1">
                  {members.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">No members found</div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(member.user.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {member.user.username}
                              {createdBy === member.user.username && <Shield className="h-3.5 w-3.5 text-blue-500" />}
                              {member.user.role?.includes("admin") && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                            </div>
                            {member.user.email && (
                              <div className="text-xs text-muted-foreground">{member.user.email}</div>
                            )}
                          </div>
                        </div>

                        {/* Don't show remove button for the group creator */}
                        {createdBy !== member.user.username && (
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(member.userId)}>
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearchUsers} disabled={searchQuery.length < 2 || searching}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              <ScrollArea className="h-60 border rounded-md">
                <div className="p-2 space-y-1">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchQuery.length < 2 ? "Type at least 2 characters to search" : "No users found"}
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {user.username}
                              {user.role?.includes("admin") && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                            </div>
                            {user.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddUser(user.id)}
                          className="flex items-center gap-1"
                        >
                          <UserPlus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

