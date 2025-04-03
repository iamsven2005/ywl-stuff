"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import type { User } from "@prisma/client"
import { getAllUsersForPermissions, assignProjectAssignment, getProjectAssignments, removeProjectAssignment } from "./actions"

interface AssignUsersModalProps {
  projectId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AssignUsersModal: React.FC<AssignUsersModalProps> = ({ projectId, isOpen, onClose, onSuccess }) => {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [assignedUsers, setAssignedUsers] = useState<{ id: number; userId: number; role: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await getAllUsersForPermissions()
        setUsers(usersData.users)

        const assignments = await getProjectAssignments(projectId)
        setAssignedUsers(assignments)

        const assignedUserIds = assignments.map((a) => a.userId.toString())
        setSelectedUserIds(assignedUserIds)

        const defaultRole = assignments.length > 0 ? assignments[0].role : null
        setRole(defaultRole)
      } catch (error) {
        toast.error("Failed to load users or assignments")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      setLoading(true)
      fetchData()
    }
  }, [isOpen, projectId])

  const handleCheckboxChange = (userId: string, checked: boolean) => {
    setSelectedUserIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    )
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
  
      const currentAssignedIds = assignedUsers.map((a) => a.userId.toString())
  
      // Assign newly selected users
      for (const userId of selectedUserIds) {
        if (!currentAssignedIds.includes(userId)) {
          await assignProjectAssignment(projectId, Number(userId), role ?? "")
        }
      }
  
      // Remove users that were assigned but are now unchecked
      for (const assigned of assignedUsers) {
        if (!selectedUserIds.includes(assigned.userId.toString())) {
            await removeProjectAssignment(assigned.id)
        }
      }
  
      toast.success("User assignments updated")
      onSuccess()
      onClose()
    } catch (error) {
      toast.error("Failed to update assignments")
      console.error("Assignment update error:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Users to Project</DialogTitle>
        </DialogHeader>

        {loading && users.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Loading users...</div>
        ) : (
          <div className="space-y-6">
<div>
  <Label className="mb-2 block">Select Users</Label>

  <input
    type="text"
    placeholder="Search users..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full px-3 py-2 mb-2 border rounded-md text-sm"
  />

  <div className="max-h-[200px] overflow-y-auto space-y-2">
    {filteredUsers.map((user) => {
      const userIdStr = user.id.toString()
      const isChecked = selectedUserIds.includes(userIdStr)
      return (
        <div key={user.id} className="flex items-center space-x-3">
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => handleCheckboxChange(userIdStr, !!checked)}
          />
          <span className="text-sm">{user.username}</span>
        </div>
      )
    })}
    {filteredUsers.length === 0 && (
      <div className="text-sm text-gray-500">No users found</div>
    )}
  </div>
</div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={loading}>
                Assign Users
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
