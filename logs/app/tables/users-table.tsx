"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  RefreshCw,
  Trash2,
  Edit,
  Plus,
  User,
  Mail,
  Key,
  Download,
  Upload,
  Server,
  Eye,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"
import {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  getUserDevices,
  assignDeviceToUser,
  removeDeviceFromUser,
} from "../actions/user-actions"
import { getDevices } from "../actions/device-actions"
import { exportToExcel, prepareUsersForExport, generateUserImportTemplate } from "../export-utils"
import * as XLSX from "xlsx"
import { MultiCombobox } from "@/components/multi-combobox"

// Debounce function to limit how often a function can run
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Page size options
const pageSizeOptions = [10, 25, 50, 100]

// User type definition
interface UserRow {
  Username?: string
  username?: string
  Email?: string
  email?: string
  Password?: string
  password?: string
}

// Form type for adding/editing users
interface UserForm {
  username: string
  email: string
  password: string
  role: "ADMIN" | "USER" | "DRAFTER"
  devices: number[]
}


export default function UsersTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)

  // Form state
  const [userForm, setUserForm] = useState<UserForm>({
    username: "",
    email: "",
    password: "",
    role: "USER", // ✅ Provide a default valid role
    devices: [],
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Apply debounced search
  const debouncedSearch = debounce((value: string) => {
    setDebouncedSearchQuery(value)
    // Reset to first page when search changes
    setCurrentPage(1)
  }, 300)

  // Update search query and trigger debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  // Fetch users with filters
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const result = await getUsers({
        search: debouncedSearchQuery,
        page: currentPage,
        pageSize: pageSize,
      })

      setUsers(result.users)
      setTotalPages(result.pageCount)
      setTotalItems(result.totalCount)
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all devices for device selection
  const fetchDevices = async () => {
    try {
      const result = await getDevices({ pageSize: 1000 }) // Get all devices
      setDevices(result.devices)
    } catch (error) {
      toast.error("Failed to fetch devices")
    }
  }

  // Load users when filters or pagination changes
  useEffect(() => {
    fetchUsers()
  }, [debouncedSearchQuery, currentPage, pageSize])

  // Load devices on component mount
  useEffect(() => {
    fetchDevices()
  }, [])

  // Handle user selection
  const handleSelectUser = (id: number) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((userId) => userId !== id))
    } else {
      setSelectedUsers([...selectedUsers, id])
    }
  }

  // Handle select all users
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((user) => user.id))
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Open add user modal
  const openAddModal = () => {
    setUserForm({
      username: "",
      email: "",
      password: "",
      role: "USER", // ✅ Ensure it's a valid value
      devices: [],
    })
    setAddModalOpen(true)
  }
  

  // Open edit user modal
  const openEditModal = async (user: any) => {
    setCurrentUser(user)

    try {
      // Get user's devices
      const userDevices = await getUserDevices(user.id)

      setUserForm({
        username: user.username,
        email: user.email || "",
        password: user.password,
        role: user.role ?? "USER", // ✅ Default to "USER" if role is missing
        devices: userDevices.map((d: any) => d.deviceId),
      })
      
      setEditModalOpen(true)
    } catch (error) {
      toast.error("Failed to load user details")
    }
  }

  // Open delete user modal
  const openDeleteModal = (user: any) => {
    setCurrentUser(user)
    setDeleteModalOpen(true)
  }

  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  

  // Handle device selection change
  const handleDeviceChange = (selectedDevices: string[]) => {
    setUserForm((prev) => ({
      ...prev,
      devices: selectedDevices.map((id) => Number(id)),
    }))
  }

  // Handle add user
  const handleAddUser = async () => {
    if (!userForm.username) {
      toast.error("Username is required")
      return
    }

    if (!userForm.password) {
      toast.error("Password is required")
      return
    }

    try {
      const newUser = await addUser({
        username: userForm.username,
        email: userForm.email || null,
        password: userForm.password,
      })

      // Assign devices if any are selected
      if (userForm.devices.length > 0) {
        await Promise.all(userForm.devices.map((deviceId) => assignDeviceToUser({ userId: newUser.id, deviceId })))
      }

      toast.success("User added successfully")
      setAddModalOpen(false)
      fetchUsers()
      router.refresh()
    } catch (error: any) {
      if (error.message?.includes("Unique constraint")) {
        toast.error("Username or email already exists")
      } else {
        toast.error("Failed to add user")
      }
    }
  }

  // Handle update user
  const handleUpdateUser = async () => {
    if (!currentUser || !userForm.username) {
      toast.error("Username is required")
      return
    }

    try {
      // Update user details
      await updateUser({
        id: currentUser.id,
        username: userForm.username,
        email: userForm.email || null,
        password: userForm.password || undefined, // Only update if provided
        role: userForm.role, // ✅ Ensure role is updated
      })
      
      
      // Get current user devices
      const currentDevices = await getUserDevices(currentUser.id)
      const currentDeviceIds = currentDevices.map((d: any) => d.deviceId)

      // Determine which devices to add and which to remove
      const devicesToAdd = userForm.devices.filter((id) => !currentDeviceIds.includes(id))
      const devicesToRemove = currentDeviceIds.filter((id) => !userForm.devices.includes(id))

      // Add new device associations
      await Promise.all(devicesToAdd.map((deviceId) => assignDeviceToUser({ userId: currentUser.id, deviceId })))

      // Remove device associations
      await Promise.all(devicesToRemove.map((deviceId) => removeDeviceFromUser({ userId: currentUser.id, deviceId })))

      toast.success("User updated successfully")
      setEditModalOpen(false)
      fetchUsers()
      router.refresh()
    } catch (error: any) {
      if (error.message?.includes("Unique constraint")) {
        toast.error("Username or email already exists")
      } else {
        toast.error("Failed to update user")
      }
    }
  }

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!currentUser) return

    try {
      await deleteUser(currentUser.id)
      toast.success("User deleted successfully")
      setDeleteModalOpen(false)
      fetchUsers()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete user")
    }
  }

  // Handle delete selected users
  const handleDeleteSelected = async () => {
    if (!selectedUsers.length) return

    try {
      // Delete each selected user
      await Promise.all(selectedUsers.map((id) => deleteUser(id)))
      toast.success(`Deleted ${selectedUsers.length} users`)
      setSelectedUsers([])
      fetchUsers()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete users")
    }
  }

  // Generate pagination items
  const getPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Calculate range of pages to show
    const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)

    // Adjust if we're near the beginning
    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  // Export users to Excel
  const handleExport = () => {
    if (users.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = prepareUsersForExport(users)
      exportToExcel(exportData, `users-export-${new Date().toISOString().split("T")[0]}`)
      toast.success("Users exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export users")
    }
  }

  // Handle file change for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)

    // Read the file to preview
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target?.result
        const workbook = XLSX.read(binaryStr, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        // Preview the first 5 rows
        setImportPreview(data.slice(0, 5))
      } catch (error) {
        console.error("Error reading Excel file:", error)
        toast.error("Failed to read Excel file")
      }
    }
    reader.readAsBinaryString(file)
  }

  // Import users from Excel
  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file to import")
      return
    }

    setIsImporting(true)
    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const binaryStr = evt.target?.result
          const workbook = XLSX.read(binaryStr, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const data: UserRow[] = XLSX.utils.sheet_to_json(worksheet)

          let successCount = 0
          let errorCount = 0

          for (const row of data) {
            try {
              const userData = {
                username: row.Username || row.username || "",
                email: row.Email || row.email || null,
                password: row.Password || row.password || "",
              }

              if (!userData.username || !userData.password) {
                errorCount++
                continue
              }

              await addUser(userData)
              successCount++
            } catch (error) {
              console.error("Error importing user:", error)
              errorCount++
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} users`)
            fetchUsers()
            router.refresh()
            setImportModalOpen(false)
          }

          if (errorCount > 0) {
            toast.error(`Failed to import ${errorCount} users`)
          }
        } catch (error) {
          console.error("Error processing Excel file:", error)
          toast.error("Failed to process Excel file")
        } finally {
          setIsImporting(false)
        }
      }
      reader.readAsBinaryString(importFile)
    } catch (error) {
      console.error("Import error:", error)
      toast.error("Failed to import users")
      setIsImporting(false)
    }
  }

  // Prepare device options for the combobox
  const deviceOptions = devices.map((device) => ({
    label: device.name,
    value: device.id.toString(),
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-[200px] sm:w-[300px]"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchUsers()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>

          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>

          {selectedUsers.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete ({selectedUsers.length})
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[200px]">Username</TableHead>
              <TableHead className="w-[250px]">Email</TableHead>
              <TableHead className="w-[150px]">Created</TableHead>
              <TableHead className="w-[150px]">Updated</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                    />
                  </TableCell>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{formatDate(user.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.devices && user.devices.length > 0 ? (
                        user.devices.map((device: any) => (
                          <Badge key={device.deviceId} variant="outline" className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            {device.device?.name || `Device ${device.deviceId}`}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">No devices</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(user)} title="Edit User">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(user)}
                        title="Delete User"
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {users.length} of {totalItems} results
          </span>
          <select
            className="h-8 w-[70px] rounded-md border border-input bg-background px-2 text-sm"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                isActive={currentPage > 1}
              />
            </PaginationItem>

            {getPaginationItems()}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                isActive={currentPage < totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Add User Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Enter the details for the new user.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  value={userForm.username}
                  onChange={handleFormChange}
                  className="flex-1"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={handleFormChange}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <div className="col-span-3">
              <select
                id="role"
                name="role"
                value={userForm.role}
                onChange={handleFormChange}
                className="h-8 w-full border border-input bg-background px-2 text-sm rounded-md"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="DRAFTER">Drafter</option>
              </select>
            </div>
          </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={handleFormChange}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="devices" className="text-right pt-2">
                Devices
              </Label>
              <div className="col-span-3">
                <MultiCombobox
                  options={deviceOptions}
                  selected={userForm.devices.map((id) => id.toString())}
                  onChange={handleDeviceChange}
                  placeholder="Select devices..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right">
                Username <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-username"
                  name="username"
                  value={userForm.username}
                  onChange={handleFormChange}
                  className="flex-1"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={handleFormChange}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-role" className="text-right">
              Role
            </Label>
            <div className="col-span-3">
              <select
                id="edit-role"
                name="role"
                value={userForm.role}
                onChange={handleFormChange}
                className="h-8 w-full border border-input bg-background px-2 text-sm rounded-md"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="DRAFTER">Drafter</option>
              </select>
            </div>
          </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">
                Password
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 relative">
                  <Input
                    id="edit-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={handleFormChange}
                    className="pr-10"
                    placeholder="Leave blank to keep current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-devices" className="text-right pt-2">
                Devices
              </Label>
              <div className="col-span-3">
                <MultiCombobox
                  options={deviceOptions}
                  selected={userForm.devices.map((id) => id.toString())}
                  onChange={handleDeviceChange}
                  placeholder="Select devices..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user "{currentUser?.username}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Users Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Users</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import users. The file should have columns for Username, Email, and Password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="import-file">Excel File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              <p className="text-sm text-muted-foreground">Supported formats: .xlsx, .xls</p>
            </div>

            {importPreview.length > 0 && (
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2">Preview (first 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(importPreview[0]).map((key) => (
                          <th key={key} className="text-left p-2">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, index) => (
                        <tr key={index} className="border-b">
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="p-2">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  generateUserImportTemplate()
                  toast.success("Template downloaded successfully")
                } catch (error) {
                  console.error("Template download error:", error)
                  toast.error("Failed to download template")
                }
              }}
              disabled={isImporting}
            >
              Download Template
            </Button>
            <Button onClick={handleImport} disabled={!importFile || isImporting}>
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Users"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

