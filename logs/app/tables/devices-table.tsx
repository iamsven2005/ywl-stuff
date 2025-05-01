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
import { Textarea } from "@/components/ui/textarea"
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
  Server,
  Network,
  Key,
  FileText,
  Eye,
  EyeOff,
  Download,
  Upload,
  Wand2,
} from "lucide-react"
import { toast } from "sonner"
// Add the import for export utilities at the top of the file
import * as XLSX from "xlsx"
import { addDevice, deleteDevice, getAllDeviceIps, getDevices, updateDevice } from "../actions/device-actions"
import { exportToExcel, generateDeviceImportTemplate, prepareDevicesForExport } from "../export-utils"
import { DeviceStatusIndicator } from "@/components/device-status-indicator"
// Import the DeviceStatusIndicator component
import { useDeviceStatus } from "../hooks/use-device-status" // Adjust path if needed
import { devices } from "@/prisma/generated/main"

// Debounce function to limit how often a function can run
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Add this function after the debounce function
// Function to check if an IP is already assigned to another device
const isIpAlreadyAssigned = (ip: string, devices: any[], currentDeviceId?: number) => {
  return devices.some((device) => device.ip_address === ip && (!currentDeviceId || device.id !== currentDeviceId))
}

// Function to generate available IPs in the same /24 subnet
const generateAvailableIps = (baseIp: string, devices: any[]) => {
  // Extract the subnet part (first three octets)
  const ipParts = baseIp.split(".")
  if (ipParts.length !== 4) return []

  const subnet = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`

  // Generate a list of all possible IPs in this subnet
  const allIps = Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`)

  // Filter out IPs that are already assigned
  return allIps.filter((ip) => !isIpAlreadyAssigned(ip, devices))
}

// Page size options
const pageSizeOptions = [5, 10, 25, 50, 100]

// Device type definition
interface DeviceRow {
  Name?: string
  "IP Address"?: string
  ip_address?: string
  "MAC Address"?: string
  mac_address?: string
  Password?: string
  password?: string
  Notes?: string
  notes?: string
}
// Form type for adding/editing devices
interface DeviceForm {
  name: string
  ip_address: string
  mac_address: string
  password: string
  notes: string
}

export default function DevicesTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedDevices, setSelectedDevices] = useState<number[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentDevice, setCurrentDevice] = useState<devices | null>(null)
  // Add these state variables inside the DevicesTable component
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  // Add these state variables inside the DevicesTable component
  const [ipError, setIpError] = useState<string | null>(null)
  const [suggestedIps, setSuggestedIps] = useState<string[]>([])
  const [showIpSuggestions, setShowIpSuggestions] = useState(false)

  // Form state
  const [deviceForm, setDeviceForm] = useState<DeviceForm>({
    name: "",
    ip_address: "",
    mac_address: "",
    password: "",
    notes: "",
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [assignedIps, setAssignedIps] = useState<string[]>([])
  const [searchAvailableIp, setSearchAvailableIp] = useState("")
  const [searchSuggestedIp, setSearchSuggestedIp] = useState("")

  useEffect(() => {
    const fetchAllIps = async () => {
      try {
        const ips = await getAllDeviceIps()
        if(ips){
          setAssignedIps(ips)
        }
      } catch (error) {
        console.error("Failed to fetch IPs", error)
      }
    }
  
    fetchAllIps()
  }, [])
  // Apply debounced search
  const handleSearchSuggestedIp = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchSuggestedIp(e.target.value)
  }
  
  const debouncedSearch = debounce((value: string) => {
    setDebouncedSearchQuery(value)
    // Reset to first page when search changes
    setCurrentPage(1)
  }, 300)
  const { deviceStatuses, isConnected } = useDeviceStatus()

  // Update search query and trigger debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  // Fetch devices with filters
  const fetchDevices = async () => {
    setIsLoading(true)
    try {
      const result = await getDevices({
        search: debouncedSearchQuery,
        page: currentPage,
        pageSize: pageSize,
      })
      if (result) {
        setDevices(result.devices)
        setTotalPages(result.pageCount)
        setTotalItems(result.totalCount)
      }
    } catch (error) {
      toast.error("Failed to fetch devices")
    } finally {
      setIsLoading(false)
    }
  }

  // Load devices when filters or pagination changes
  useEffect(() => {
    fetchDevices()
  }, [debouncedSearchQuery, currentPage, pageSize])

  // Handle device selection
  const handleSelectDevice = (id: number) => {
    if (selectedDevices.includes(id)) {
      setSelectedDevices(selectedDevices.filter((deviceId) => deviceId !== id))
    } else {
      setSelectedDevices([...selectedDevices, id])
    }
  }

  // Handle select all devices
  const handleSelectAll = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([])
    } else {
      setSelectedDevices(devices.map((device) => device.id))
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

  // Open add device modal
  const openAddModal = () => {
    setDeviceForm({
      name: "",
      ip_address: "",
      mac_address: "",
      password: "",
      notes: "",
    })
    setAddModalOpen(true)
  }

  // Open edit device modal
  const openEditModal = (device: devices) => {
    setCurrentDevice(device)
    setDeviceForm({
      name: device.name,
      ip_address: device.ip_address || "",
      mac_address: device.mac_address || "",
      password: device.password || "",
      notes: device.notes,
    })
    setEditModalOpen(true)
  }

  // Open delete device modal
  const openDeleteModal = (device: devices) => {
    setCurrentDevice(device)
    setDeleteModalOpen(true)
  }
  const handleSearchAvailableIp = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchAvailableIp(e.target.value)
  }
  
  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDeviceForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Check for duplicate IP addresses when the IP field changes
    if (name === "ip_address" && value) {
      const isDuplicate = isIpAlreadyAssigned(value, devices, currentDevice?.id)

      if (isDuplicate) {
        setIpError(`This IP address is already assigned to another device`)

        // Generate suggestions from the same subnet
        const availableIps = generateAvailableIps(value, devices).slice(0, 5) // Get first 5 available IPs
        setSuggestedIps(availableIps)
        setShowIpSuggestions(true)
      } else {
        setIpError(null)
        setShowIpSuggestions(false)
      }
    } else if (name === "ip_address" && !value) {
      setIpError(null)
      setShowIpSuggestions(false)
    }
  }

  // Add a function to select a suggested IP
  const selectSuggestedIp = (ip: string) => {
    setDeviceForm((prev) => ({
      ...prev,
      ip_address: ip,
    }))
    setIpError(null)
    setShowIpSuggestions(false)
  }

  // Handle add device
  const handleAddDevice = async () => {
    if (!deviceForm.name) {
      toast.error("Device name is required")
      return
    }

    if (deviceForm.ip_address && isIpAlreadyAssigned(deviceForm.ip_address, devices)) {
      setIpError(`This IP address is already assigned to another device`)
      return
    }

    try {
      await addDevice({
        name: deviceForm.name,
        ip_address: deviceForm.ip_address || null,
        mac_address: deviceForm.mac_address || null,
        password: deviceForm.password || null,
        notes: deviceForm.notes,
      })
      toast.success("Device added successfully")
      setAddModalOpen(false)
      fetchDevices()
      router.refresh()
    } catch (error) {
      toast.error("Failed to add device")
    }
  }

  // Handle update device
  const handleUpdateDevice = async () => {
    if (!currentDevice || !deviceForm.name) {
      toast.error("Device name is required")
      return
    }

    if (deviceForm.ip_address && isIpAlreadyAssigned(deviceForm.ip_address, devices, currentDevice.id)) {
      setIpError(`This IP address is already assigned to another device`)
      return
    }

    try {
      await updateDevice({
        id: currentDevice.id,
        name: deviceForm.name,
        ip_address: deviceForm.ip_address || null,
        mac_address: deviceForm.mac_address || null,
        password: deviceForm.password || null,
        notes: deviceForm.notes,
      })
      toast.success("Device updated successfully")
      setEditModalOpen(false)
      fetchDevices()
      router.refresh()
    } catch (error) {
      toast.error("Failed to update device")
    }
  }

  // Handle delete device
  const handleDeleteDevice = async () => {
    if (!currentDevice) return

    try {
      await deleteDevice(currentDevice.id)
      toast.success("Device deleted successfully")
      setDeleteModalOpen(false)
      fetchDevices()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete device")
    }
  }

  // Handle delete selected devices
  const handleDeleteSelected = async () => {
    if (!selectedDevices.length) return

    try {
      // Delete each selected device
      await Promise.all(selectedDevices.map((id) => deleteDevice(id)))
      toast.success(`Deleted ${selectedDevices.length} devices`)
      setSelectedDevices([])
      fetchDevices()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete devices")
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
    return date.toLocaleString() // Convert Date object to readable string
  }

  // Add the export function inside the DevicesTable component
  const handleExport = () => {
    if (devices.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = prepareDevicesForExport(devices)
      exportToExcel(exportData, `devices-export-${new Date().toISOString().split("T")[0]}`)
      toast.success("Devices exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export devices")
    }
  }

  // Add the import functions inside the DevicesTable component
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

          // ✅ Explicitly type the data returned by sheet_to_json
          const data: DeviceRow[] = XLSX.utils.sheet_to_json(worksheet)

          let successCount = 0
          let errorCount = 0

          for (const row of data) {
            try {
              const deviceData = {
                name: row.Name || "",
                ip_address: row["IP Address"] || row.ip_address || null,
                mac_address: row["MAC Address"] || row.mac_address || null,
                password: row.Password || row.password || null,
                notes: row.Notes || row.notes || "",
              }

              if (!deviceData.name) {
                errorCount++
                continue
              }

              await addDevice(deviceData)
              successCount++
            } catch (error) {
              console.error("Error importing device:", error)
              errorCount++
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} devices`)
            fetchDevices()
            router.refresh()
            setImportModalOpen(false)
          }

          if (errorCount > 0) {
            toast.error(`Failed to import ${errorCount} devices`)
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
      toast.error("Failed to import devices")
      setIsImporting(false)
    }
  }
  const baseIp = "192.168.1.0" // define your network base, example 192.168.1.0/24

  // Generate all 256 possible IPs in /24 subnet (1-254 usable)
  const subnetParts = baseIp.split(".")
  const subnetPrefix = `${subnetParts[0]}.${subnetParts[1]}.${subnetParts[2]}`
  const allIps = Array.from({ length: 254 }, (_, i) => `${subnetPrefix}.${i + 1}`) // 1 to 254
  
  // Remove already assigned IPs
  const availableIps = allIps.filter(ip => !assignedIps.includes(ip))
  const generatePassword = (length = 12) => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+=-[]{}|;:,.<>?"
  
    const allChars = uppercase + lowercase + numbers + symbols
    let password = ""
  
    // Ensure at least one character from each category
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
    password += numbers.charAt(Math.floor(Math.random() * numbers.length))
    password += symbols.charAt(Math.floor(Math.random() * symbols.length))
  
    // Fill the rest of the password
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length))
    }
  
    // Shuffle the password characters
    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("")
  }
  const handleGeneratePassword = () => {
    const newPassword = generatePassword()
    setDeviceForm((prev) => ({
      ...prev,
      password: newPassword,
    }))
    setShowPassword(true) // Show the password when generated
    toast.success("Password generated")
  }

  return (
    <div className="space-y-4 flex flex-row gap-2">
      <div className="flex flex-col">
      <Input
    type="search"
    placeholder="Available Ips"
    value={searchAvailableIp}
    onChange={handleSearchAvailableIp}
    className="w-full"
  />
      {availableIps.length > 0 ? (
  <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
    {availableIps
      .filter((ip) => ip.includes(searchAvailableIp))
      .slice(0, 256)
      .map((ip) => (
        <Badge key={ip} variant="outline" className="font-mono w-full justify-center">
          {ip}
        </Badge>
      ))}
  </div>
) : (
  <p className="text-muted-foreground text-sm">No available IPs</p>
)}


      </div>
<div className="flex flex-col gap-4 w-full">
<div className="flex">
          <Input
            type="search"
            placeholder="Search devices..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full max-w-sm"
          />
          <Button variant="outline" className="ml-2" onClick={fetchDevices}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="ml-2" onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Add Device
          </Button>
          <Button variant="outline" className="ml-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="ml-2" onClick={() => setImportModalOpen(true)}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={devices.length > 0 && selectedDevices.length === devices.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[150px]">IP Address</TableHead>
              <TableHead className="w-[180px]">MAC Address</TableHead>
              <TableHead className="w-[150px]">Added</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No devices found.
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedDevices.includes(device.id)}
                      onCheckedChange={() => handleSelectDevice(device.id)}
                    />
                  </TableCell>
                  <TableCell>{device.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{device.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {device.ip_address ? (
                      <Badge variant="outline" className="font-mono">
                        {device.ip_address}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.mac_address ? (
                      <span className="font-mono text-xs">{device.mac_address}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(device.time)}</TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate">{device.notes}</div>
                  </TableCell>
                  <TableCell>
                    {device.users && device.users.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {device.users.map(({ user }) => (
                          <li key={user.id}>
                            {user.username}{" "}
                            {user.email && <span className="text-muted-foreground">({user.email})</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">No users</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <DeviceStatusIndicator status={deviceStatuses[device.id]} isConnected={isConnected} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(device)} title="Edit Device">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(device)}
                        title="Delete Device"
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {devices.length} of {totalItems} results
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
      </div>

      {/* Add Device Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>Enter the details for the new device.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={deviceForm.name}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ip_address" className="text-right">
                IP Address
              </Label>
              <div className="col-span-3 flex flex-col gap-1 w-full">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 relative">
                    <Input
                      id="ip_address"
                      name="ip_address"
                      value={deviceForm.ip_address}
                      onChange={handleFormChange}
                      placeholder="192.168.1.100"
                      className={`flex-1 ${ipError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {ipError && <div className="text-xs text-red-500 mt-1">{ipError}</div>}
                  </div>
                </div>

                {showIpSuggestions && suggestedIps.length > 0 && (
  <div className="mt-2 border rounded-md p-2">
    <p className="text-xs text-muted-foreground mb-1">Available IPs in this subnet:</p>

    {/* Search input for suggested IPs */}
    <div className="mb-2">
      <Input
        type="search"
        placeholder="Search suggested IPs..."
        value={searchSuggestedIp}
        onChange={handleSearchSuggestedIp}
        className="w-full"
      />
    </div>

    {/* Filtered IP list */}
    <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
      {suggestedIps
        .filter((ip) => ip.includes(searchSuggestedIp))
        .slice(0, 50) // Optional: limit number shown
        .map((ip) => (
          <Badge
            key={ip}
            variant="outline"
            className="cursor-pointer hover:bg-muted"
            onClick={() => selectSuggestedIp(ip)}
          >
            {ip}
          </Badge>
        ))}
    </div>
  </div>
)}

              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mac_address" className="text-right">
                MAC Address
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Network className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="mac_address"
                  name="mac_address"
                  value={deviceForm.mac_address}
                  onChange={handleFormChange}
                  placeholder="00:1A:2B:3C:4D:5E"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={deviceForm.password}
                    onChange={handleFormChange}
                    className="pr-20"
                  />
                  <div className="absolute right-0 top-0 h-full flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-full"
                      onClick={handleGeneratePassword}
                      title="Generate Password"
                    >
                      <Wand2 className="h-4 w-4" />
                      <span className="sr-only">Generate Password</span>
                    </Button>
                  </div>
                </div>
              </div>
              </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <div className="col-span-3 flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-2" />
                <Textarea
                  id="notes"
                  name="notes"
                  value={deviceForm.notes}
                  onChange={handleFormChange}
                  className="flex-1"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDevice}>Add Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Device Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update the device details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={deviceForm.name}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ip_address" className="text-right">
                IP Address
              </Label>
              <div className="col-span-3 flex flex-col gap-1 w-full">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 relative">
                    <Input
                      id="edit-ip_address"
                      name="ip_address"
                      value={deviceForm.ip_address}
                      onChange={handleFormChange}
                      placeholder="192.168.1.100"
                      className={`flex-1 ${ipError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {ipError && <div className="text-xs text-red-500 mt-1">{ipError}</div>}
                  </div>
                </div>

                {showIpSuggestions && suggestedIps.length > 0 && (
                  <div className="mt-2 border rounded-md p-2">
                    <p className="text-xs text-muted-foreground mb-1">Available IPs in this subnet:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestedIps.map((ip) => (
                        <Badge
                          key={ip}
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => selectSuggestedIp(ip)}
                        >
                          {ip}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-mac_address" className="text-right">
                MAC Address
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Network className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-mac_address"
                  name="mac_address"
                  value={deviceForm.mac_address}
                  onChange={handleFormChange}
                  placeholder="00:1A:2B:3C:4D:5E"
                  className="flex-1"
                />
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
                    value={deviceForm.password}
                    onChange={handleFormChange}
                    className="pr-20"
                  />
                  <div className="absolute right-0 top-0 h-full flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-full"
                      onClick={handleGeneratePassword}
                      title="Generate Password"
                    >
                      <Wand2 className="h-4 w-4" />
                      <span className="sr-only">Generate Password</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-notes" className="text-right pt-2">
                Notes
              </Label>
              <div className="col-span-3 flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-2" />
                <Textarea
                  id="edit-notes"
                  name="notes"
                  value={deviceForm.notes}
                  onChange={handleFormChange}
                  className="flex-1"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDevice}>Update Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Device Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the device "{currentDevice?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDevice}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Import Devices Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Devices</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import devices. The file should have columns for Name, IP Address, MAC Address,
              Password, and Notes.
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

            {/* Add the template download button */}
            <Button
              variant="outline"
              onClick={() => {
                try {
                  generateDeviceImportTemplate()
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
                "Import Devices"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
