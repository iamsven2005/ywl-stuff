"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Plus, Trash2, Edit, Search, RefreshCw, Shield, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MultiCombobox } from "@/components/multi-combobox"
import {
  getAllPagePermissions,
  createPagePermission,
  updatePagePermission,
  deletePagePermission,
  getAllRoles,
  getAllUsersForPermissions,
} from "@/app/actions/permission-actions"
import Link from "next/link"

export default function PermissionsTable() {
  const router = useRouter()
  const [permissions, setPermissions] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPermissions, setFilteredPermissions] = useState<any[]>([])

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentPermission, setCurrentPermission] = useState<any | null>(null)

  // Form state
  const [permissionForm, setPermissionForm] = useState({
    route: "",
    description: "",
    roles: [] as string[],
    userIds: [] as string[],
  })

  // Fetch permissions, roles, and users
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [permissionsResult, rolesResult, usersResult] = await Promise.all([
        getAllPagePermissions(),
        getAllRoles(),
        getAllUsersForPermissions(),
      ])

      setPermissions(permissionsResult.permissions)
      setFilteredPermissions(permissionsResult.permissions)
      setRoles(rolesResult.roles)
      setUsers(usersResult.users)
    } catch (error) {
      toast.error("Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter permissions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPermissions(permissions)
      return
    }

    const filtered = permissions.filter(
      (permission) =>
        permission.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (permission.description && permission.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    setFilteredPermissions(filtered)
  }, [searchQuery, permissions])

  // Open add permission modal
  const openAddModal = () => {
    setPermissionForm({
      route: "",
      description: "",
      roles: [],
      userIds: [],
    })
    setAddModalOpen(true)
  }

  // Open edit permission modal
  const openEditModal = (permission: any) => {
    setCurrentPermission(permission)
    setPermissionForm({
      route: permission.route,
      description: permission.description || "",
      roles: permission.allowedRoles.map((r: any) => r.roleName),
      userIds: permission.allowedUsers.map((u: any) => u.user.id.toString()),
    })
    setEditModalOpen(true)
  }

  // Open delete permission modal
  const openDeleteModal = (permission: any) => {
    setCurrentPermission(permission)
    setDeleteModalOpen(true)
  }

  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPermissionForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle role selection change
  const handleRoleChange = (selectedRoles: string[]) => {
    setPermissionForm((prev) => ({
      ...prev,
      roles: selectedRoles,
    }))
  }

  // Handle user selection change
  const handleUserChange = (selectedUsers: string[]) => {
    setPermissionForm((prev) => ({
      ...prev,
      userIds: selectedUsers,
    }))
  }

  // Handle add permission
  const handleAddPermission = async () => {
    if (!permissionForm.route) {
      toast.error("Route is required")
      return
    }

    try {
      await createPagePermission({
        route: permissionForm.route,
        description: permissionForm.description,
        roles: permissionForm.roles,
        userIds: permissionForm.userIds.map((id) => Number.parseInt(id)),
      })

      toast.success("Permission added successfully")
      setAddModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error("Failed to add permission")
    }
  }

  // Handle update permission
  const handleUpdatePermission = async () => {
    if (!currentPermission || !permissionForm.route) {
      toast.error("Route is required")
      return
    }

    try {
      await updatePagePermission(currentPermission.id, {
        route: permissionForm.route,
        description: permissionForm.description,
        roles: permissionForm.roles,
        userIds: permissionForm.userIds.map((id) => Number.parseInt(id)),
      })

      toast.success("Permission updated successfully")
      setEditModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error("Failed to update permission")
    }
  }

  // Handle delete permission
  const handleDeletePermission = async () => {
    if (!currentPermission) return

    try {
      await deletePagePermission(currentPermission.id)
      toast.success("Permission deleted successfully")
      setDeleteModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error("Failed to delete permission")
    }
  }

  // Prepare role options for the combobox
  const roleOptions = roles.map((role) => ({
    label: role.name,
    value: role.name,
  }))

  // Prepare user options for the combobox
  const userOptions = users.map((user) => ({
    label: user.username + (user.email ? ` (${user.email})` : ""),
    value: user.id.toString(),
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search permissions..."
              className="pl-8 w-[200px] sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Permission
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[200px]">Route</TableHead>
              <TableHead className="w-[250px]">Description</TableHead>
              <TableHead>Allowed Roles</TableHead>
              <TableHead>Allowed Users</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPermissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No permissions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPermissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>{permission.id}</TableCell>
                  <TableCell>
                    <Link href={permission.route} className="font-medium">{permission.route}</Link>
                  </TableCell>
                  <TableCell>{permission.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {permission.allowedRoles.length > 0 ? (
                        permission.allowedRoles.map((role: any) => (
                          <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {role.roleName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {permission.allowedUsers.length > 0 ? (
                        permission.allowedUsers.map((userPerm: any) => (
                          <Badge key={userPerm.id} variant="outline" className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {userPerm.user.username}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">No users</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(permission)}
                        title="Edit Permission"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(permission)}
                        title="Delete Permission"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Permission Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Permission</DialogTitle>
            <DialogDescription>Define a new page permission with allowed roles and users.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="route" className="text-right">
                Route <span className="text-red-500">*</span>
              </Label>
              <Input
                id="route"
                name="route"
                value={permissionForm.route}
                onChange={handleFormChange}
                placeholder="/logs, /admin/settings, etc."
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={permissionForm.description}
                onChange={handleFormChange}
                placeholder="View system logs, Manage settings, etc."
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="roles" className="text-right pt-2">
                Allowed Roles
              </Label>
              <div className="col-span-3">
                <MultiCombobox
                  options={roleOptions}
                  selected={permissionForm.roles}
                  onChange={handleRoleChange}
                  placeholder="Select roles..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Users with these roles will have access to this route.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="users" className="text-right pt-2">
                Allowed Users
              </Label>
              <div className="col-span-3">
                <MultiCombobox
                  options={userOptions}
                  selected={permissionForm.userIds}
                  onChange={handleUserChange}
                  placeholder="Select users..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  These specific users will have access regardless of their roles.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPermission}>Add Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>Update the page permission settings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-route" className="text-right">
                Route <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-route"
                name="route"
                value={permissionForm.route}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                name="description"
                value={permissionForm.description}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-roles" className="text-right pt-2">
                Allowed Roles
              </Label>
              <div className="col-span-3">
                <MultiCombobox
                  options={roleOptions}
                  selected={permissionForm.roles}
                  onChange={handleRoleChange}
                  placeholder="Select roles..."
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-users" className="text-right pt-2">
                Allowed Users
              </Label>
              <div className="col-span-3">
                <MultiCombobox
                  options={userOptions}
                  selected={permissionForm.userIds}
                  onChange={handleUserChange}
                  placeholder="Select users..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePermission}>Update Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Permission Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the permission for route "{currentPermission?.route}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePermission}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

