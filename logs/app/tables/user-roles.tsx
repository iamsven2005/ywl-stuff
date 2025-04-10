"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { Trash2, Edit, Plus } from "lucide-react"
import { toast } from "sonner"
import { getRoles, addRole, updateRole, deleteRole } from "@/app/actions/role-actions"
import { Textarea } from "@/components/ui/textarea"


export default function UsersRolesTable() {
  const [roles, setRoles] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [roleForm, setRoleForm] = useState({ name: "", description: "" })
  const [selectedRole, setSelectedRole] = useState<any | null>(null)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [bulkRoleInput, setBulkRoleInput] = useState("")
  const [isBulkImporting, setIsBulkImporting] = useState(false)
  const [roleUserSearch, setRoleUserSearch] = useState<Record<number, string>>({})

  const handleBulkImport = async () => {
    const lines = bulkRoleInput
      .split("\n")
      .map(line => line.trim().replace(/^\d+\.\s*/, "")) // removes leading numbers like "1. " and trims
      .filter(Boolean)
  
    if (lines.length === 0) {
      toast.error("No roles to import")
      return
    }
  
    setIsBulkImporting(true)
  
    const created: string[] = []
    const failed: string[] = []
  
    for (const name of lines) {
      try {
        // Avoid duplicates (case-insensitive)
        const exists = roles.some(r => r.name.toLowerCase() === name.toLowerCase())
        if (!exists) {
          await addRole({ name, description: "" })
          created.push(name)
        }
      } catch (err) {
        failed.push(name)
      }
    }
  
    setIsBulkImporting(false)
    setBulkRoleInput("")
    fetchRoles()
  
    if (created.length) toast.success(`Added ${created.length} new roles`)
    if (failed.length) toast.error(`Failed to import ${failed.length} roles`)
  }
  
  // Fetch roles
  const fetchRoles = async () => {
    try {
      const result = await getRoles()
      setRoles(result.roles)
      setUsers(result.users)

    } catch (error) {
      toast.error("Failed to fetch roles")
    }
  }

  const filteredRoles = roles.filter((role) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      role.name.toLowerCase().includes(search) || (role.description && role.description.toLowerCase().includes(search))
    )
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  // Open role modal
  const openRoleModal = (role: any | null = null) => {
    if (role) {
      setSelectedRole(role)
      setRoleForm({ name: role.name, description: role.description })
      setIsEditing(true)
    } else {
      setSelectedRole(null)
      setRoleForm({ name: "", description: "" })
      setIsEditing(false)
    }
    setRoleModalOpen(true)
  }

  // Handle role form submission
  const handleRoleSubmit = async () => {
    if (!roleForm.name) {
      toast.error("Role name is required")
      return
    }

    try {
      if (isEditing && selectedRole) {
        await updateRole(selectedRole.id, roleForm)
        toast.success("Role updated successfully")
      } else {
        await addRole(roleForm)
        toast.success("Role added successfully")
      }
      fetchRoles()
      setRoleModalOpen(false)
    } catch (error) {
      console.log(error)
      toast.error("Failed to save role")
    }
  }

  // Handle delete role
  const handleDeleteRole = async (roleId: number) => {
    try {
      await deleteRole(roleId)
      toast.success("Role deleted successfully")
      fetchRoles()
    } catch (error) {
      toast.error("Failed to delete role")
    }
  }
  const roleMap = roles.reduce((acc, role) => {
    acc[role.name] = role
    return acc
  }, {} as Record<string, { id: number; name: string; description: string }>)
  
  const roleToUsersMap: Record<string, any[]> = {}

  users.forEach((user) => {
    user.role.forEach((roleName: string) => {
      if (!roleToUsersMap[roleName]) {
        roleToUsersMap[roleName] = []
      }
      roleToUsersMap[roleName].push(user)
    })
  })
  const filteredRoleKeys = Object.keys(roleToUsersMap).filter((roleName) => {
  const role = roleMap[roleName]
  const search = searchTerm.toLowerCase()

  return (
    roleName.toLowerCase().includes(search) ||
    role?.description?.toLowerCase().includes(search) ||
    role?.id?.toString().includes(search)
  )
})

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Roles</h2>
        <Button onClick={() => openRoleModal()} className="gap-2">
          <Plus className="h-4 w-4" /> Add Role
        </Button>
      </div>
      <div className="space-y-2 mb-6">
  <Label htmlFor="bulk-role-input">Mass Import Roles</Label>
  <Textarea
    id="bulk-role-input"
    placeholder="Enter roles, one per line..."
    rows={8}
    value={bulkRoleInput}
    onChange={(e) => setBulkRoleInput(e.target.value)}
  />
  <Button onClick={handleBulkImport} disabled={isBulkImporting}>
    {isBulkImporting ? "Importing..." : "Import Roles"}
  </Button>
</div>

      <span className="text-sm text-muted-foreground">
            Showing {filteredRoles.length}
          </span>

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Users</TableHead>
        <TableHead className="w-[100px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
  {filteredRoles.length === 0 ? (
    <TableRow>
      <TableCell colSpan={4} className="h-24 text-center">
        {searchTerm ? "No matching roles found." : "No roles found."}
      </TableCell>
    </TableRow>
  ) : (
    filteredRoles.map((role) => {
      const usersInRole = users.filter((user) =>
        user.role.includes(role.name)
      )

      return (
        <TableRow key={role.id}>
          <TableCell>{role.name}</TableCell>
          <TableCell>{role.description || "—"}</TableCell>
          <TableCell>
  {/* Search input for this role */}
  <Input
    placeholder="Search users..."
    value={roleUserSearch[role.id] || ""}
    onChange={(e) =>
      setRoleUserSearch((prev) => ({
        ...prev,
        [role.id]: e.target.value,
      }))
    }
    className="mb-2"
  />

  {/* Filtered users */}
  {usersInRole.length > 0 ? (
    <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto pr-1">
      {usersInRole
        .filter((user) => {
          const query = (roleUserSearch[role.id] || "").toLowerCase()
          return (
            user.username.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
          )
        })
        .map((user) => (
          <li key={user.id}>
            {user.username}{" "}
            {user.email && (
              <span className="text-muted-foreground">({user.email})</span>
            )}
          </li>
        ))}
    </ul>
  ) : (
    <span className="text-muted-foreground">No users</span>
  )}
</TableCell>

          <TableCell>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openRoleModal(role)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRole(role.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )
    })
  )}
</TableBody>

  </Table>
</div>



      {/* Role Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Role" : "Add Role"}</DialogTitle>
            <DialogDescription>Enter the details for the role.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="role-name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role-description" className="text-right">
                Description
              </Label>
              <Input
                id="role-description"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleSubmit}>{isEditing ? "Update Role" : "Add Role"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

