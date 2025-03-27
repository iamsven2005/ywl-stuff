"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getAllUsers, createGroup } from "../actions/chat-actions"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"

interface User {
    id: number
    username: string
    email?: string | null // ✅ Allow both undefined and null
}

export function CreateGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [groupName, setGroupName] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        try {
          const fetchedUsers = await getAllUsers()
          setUsers(fetchedUsers)
        } catch (error) {
          toast.error("Failed to fetch users")
        } finally {
          setLoading(false)
        }
      }

      fetchUsers()
    } else {
      // Reset state when dialog closes
      setGroupName("")
      setSelectedUsers([])
      setSearchQuery("")
      setLoading(true)
    }
  }, [open, toast])

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleUserToggle = (userId: number) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a name for the group")
      return
    }

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to add to the group")
      return
    }

    try {
      setCreating(true)
      const group = await createGroup(groupName.trim(), selectedUsers)
      toast.success(`${groupName} has been created successfully`)
      onOpenChange(false)
      router.push(`/chat?groupId=${group.id}`)
    } catch (error) {
      toast("Failed to create group")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Add Members</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-60 border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredUsers.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">No users found</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleUserToggle(user.id)}
                        />
                        <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                          <div>{user.username}</div>
                          {user.email && <div className="text-xs text-muted-foreground">{user.email}</div>}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            <div className="text-xs text-muted-foreground">{selectedUsers.length} users selected</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedUsers.length === 0 || creating}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

