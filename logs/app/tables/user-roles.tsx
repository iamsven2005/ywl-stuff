"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus, Trash2, Edit } from "lucide-react"

import { getRoles, addRole, updateRole, deleteRole } from "@/app/actions/role-actions"

export default function UsersRolesTable() {
  const [roles, setRoles] = useState<any[]>([])
  const [roleForm, setRoleForm] = useState({ name: "", description: "" })
  const [selectedRole, setSelectedRole] = useState<any | null>(null)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const result = await getRoles()
      setRoles(result.roles)
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

  return (
    <div className="flex gap-6">
      {/* Roles Table */}
      <div className="w-1/3 border rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Roles</h2>
          <Button onClick={() => openRoleModal()} className="gap-2">
            <Plus className="h-4 w-4" /> Add Role
          </Button>
        </div>
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
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
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.id}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openRoleModal(role)}>
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
              ))
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


