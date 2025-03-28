"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { getAllUsers, createGroup, searchUsersByRole } from "../actions/chat-actions"
import { toast } from "sonner"
import { Loader2, Search, Filter, Shield } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface User {
  id: number
  username: string
  email?: string | null
  role?: string[]
}

export function CreateGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [groupName, setGroupName] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [availableRoles, setAvailableRoles] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      fetchUsers()
    } else {
      // Reset state when dialog closes
      setGroupName("")
      setSelectedUserIds([])
      setSearchQuery("")
      setSelectedRole("all")
    }
  }, [open])

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username.toLowerCase().includes(query) || (user.email && user.email.toLowerCase().includes(query)),
        ),
      )
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const allUsers = await getAllUsers()
      setUsers(allUsers)
      setFilteredUsers(allUsers)

      // Extract unique roles from all users
      const allRoles = allUsers.flatMap((user) => user.role || [])
      const uniqueRoles = [...new Set(allRoles)]
      setAvailableRoles(uniqueRoles)
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleFilter = async (role: string) => {
    setSelectedRole(role)

    try {
      setLoading(true)
      if (role === "all") {
        const allUsers = await getAllUsers()
        setUsers(allUsers)
        setFilteredUsers(allUsers)
      } else {
        const roleUsers = await searchUsersByRole(role)
        setUsers(roleUsers)
        setFilteredUsers(roleUsers)
      }
    } catch (error) {
      toast.error("Failed to filter users by role")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name")
      return
    }

    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user")
      return
    }

    try {
      setCreating(true)
      const group = await createGroup(groupName, selectedUserIds)
      toast.success("Group created successfully")
      onOpenChange(false)
      router.push(`/chat?groupId=${group.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create group")
    } finally {
      setCreating(false)
    }
  }

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
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
          <DialogTitle className="dark:text-white">Create New Chat Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="dark:text-gray-300">
              Group Name
            </Label>
            <Input
              id="name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            />
          </div>

          <div>
            <Label className="dark:text-gray-300">Select Users</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-8 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                <Select value={selectedRole} onValueChange={handleRoleFilter}>
                  <SelectTrigger className="flex-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
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

            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground dark:text-gray-400" />
              </div>
            ) : (
              <ScrollArea className="h-60 mt-2 border rounded-md dark:border-gray-700 dark:bg-gray-900">
                <div className="p-2 space-y-1">
                  {filteredUsers.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground dark:text-gray-400">No users found</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md dark:hover:bg-gray-800"
                      >
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          className="dark:border-gray-500"
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="dark:bg-gray-700 dark:text-gray-200">
                            {getInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <label
                            htmlFor={`user-${user.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 dark:text-white"
                          >
                            {user.username}
                            {user.role?.includes("admin") && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                          </label>
                          {user.email && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400">{user.email}</p>
                          )}
                          {user.role && user.role.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.role.map((role) => (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 h-4 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                >
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCreateGroup}
              disabled={creating || !groupName.trim() || selectedUserIds.length === 0}
              className="dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {creating ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

