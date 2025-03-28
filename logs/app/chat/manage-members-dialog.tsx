"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  getGroupWithMembers,
  removeUserFromGroup,
  searchUsers,
  addUserToGroup,
  searchUsersByRole,
} from "../actions/chat-actions"
import { toast } from "sonner"
import { Loader2, Search, UserPlus, X, Shield, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [availableRoles, setAvailableRoles] = useState<string[]>([])

  useEffect(() => {
    if (open && groupId) {
      fetchGroupMembers()
      fetchAvailableRoles()
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

  const fetchAvailableRoles = async () => {
    try {
      // This would be a new server action to get all available roles
      // For now, we'll hardcode some common roles
      setAvailableRoles(["admin", "user", "moderator", "guest"])
    } catch (error) {
      console.error("Failed to fetch roles:", error)
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
    if (searchQuery.length < 2 && selectedRole === "all") {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      let results: UserType[] = []

      if (selectedRole !== "all" && searchQuery.length < 2) {
        // Search by role only
        results = await searchUsersByRole(selectedRole)
      } else if (searchQuery.length >= 2 && selectedRole !== "all") {
        // Search by both query and role
        results = await searchUsers(searchQuery, selectedRole)
      } else {
        // Search by query only
        results = await searchUsers(searchQuery)
      }

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
      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Manage Group Members</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700">
            <TabsTrigger value="current" className="dark:data-[state=active]:bg-gray-600 dark:text-gray-200">
              Current Members
            </TabsTrigger>
            <TabsTrigger value="add" className="dark:data-[state=active]:bg-gray-600 dark:text-gray-200">
              Add Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium dark:text-white">{groupName}</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">Created by {createdBy}</p>
            </div>

            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground dark:text-gray-400" />
              </div>
            ) : (
              <ScrollArea className="h-60 border rounded-md dark:border-gray-700 dark:bg-gray-900">
                <div className="p-2 space-y-1">
                  {members.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground dark:text-gray-400">No members found</div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="dark:bg-gray-700 dark:text-gray-200">
                              {getInitials(member.user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-1 dark:text-white">
                              {member.user.username}
                              {createdBy === member.user.username && <Shield className="h-3.5 w-3.5 text-blue-500" />}
                              {member.user.role?.includes("admin") && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                            </div>
                            {member.user.email && (
                              <div className="text-xs text-muted-foreground dark:text-gray-400">
                                {member.user.email}
                              </div>
                            )}
                            {member.user.role && member.user.role.length > 0 && (
                              <div className="text-xs text-muted-foreground dark:text-gray-400">
                                Roles: {member.user.role.join(", ")}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Don't show remove button for the group creator */}
                        {createdBy !== member.user.username && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveUser(member.userId)}
                            className="dark:text-gray-400 dark:hover:bg-gray-700"
                          >
                            <X className="h-4 w-4" />
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
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    <Input
                      placeholder="Search users by name or email"
                      className="pl-8 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSearchUsers}
                    disabled={(searchQuery.length < 2 && selectedRole === "all") || searching}
                    className="dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                  <span className="text-sm dark:text-gray-300">Filter by role:</span>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="flex-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                      <SelectValue placeholder="Select role" />
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

              <ScrollArea className="h-60 border rounded-md dark:border-gray-700 dark:bg-gray-900">
                <div className="p-2 space-y-1">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground dark:text-gray-400">
                      {searchQuery.length < 2 && selectedRole === "all"
                        ? "Type at least 2 characters to search or select a role"
                        : "No users found"}
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="dark:bg-gray-700 dark:text-gray-200">
                              {getInitials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-1 dark:text-white">
                              {user.username}
                              {user.role?.includes("admin") && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                            </div>
                            {user.email && (
                              <div className="text-xs text-muted-foreground dark:text-gray-400">{user.email}</div>
                            )}
                            {user.role && user.role.length > 0 && (
                              <div className="text-xs text-muted-foreground dark:text-gray-400">
                                Roles: {user.role.join(", ")}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddUser(user.id)}
                          className="flex items-center gap-1 dark:text-gray-200 dark:hover:bg-gray-700"
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

