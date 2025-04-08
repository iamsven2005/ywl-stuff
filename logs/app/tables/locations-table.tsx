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
import { Search, RefreshCw, Trash2, Edit, Plus } from "lucide-react"
import { toast } from "sonner"
import { getLocations, addLocation, updateLocation, deleteLocation } from "../actions/location-actions"
import { location } from "@prisma/client"

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

// Location form type
interface LocationForm {
  code: string
  name: string
  fullname: string
  Region  : string
  WCI_URL : string
  Remarks : string
}

export default function LocationsTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedLocations, setSelectedLocations] = useState<number[]>([])
  const [locations, setLocations] = useState<location[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<any | null>(null)

  // Form state
  const [locationForm, setLocationForm] = useState<LocationForm>({
    code: "",
    name: "",
    fullname: "",
    Region: "",
    WCI_URL: "",
    Remarks: "",
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

  // Fetch locations with filters
  const fetchLocations = async () => {
    setIsLoading(true)
    try {
      const result = await getLocations({
        search: debouncedSearchQuery,
        page: currentPage,
        pageSize: pageSize,
      })

      setLocations(result.locations)
      setTotalPages(result.pageCount)
      setTotalItems(result.totalCount)
    } catch (error) {
      toast.error("Failed to fetch locations")
    } finally {
      setIsLoading(false)
    }
  }

  // Load locations when filters or pagination changes
  useEffect(() => {
    fetchLocations()
  }, [debouncedSearchQuery, currentPage, pageSize])

  // Handle location selection
  const handleSelectLocation = (id: number) => {
    if (selectedLocations.includes(id)) {
      setSelectedLocations(selectedLocations.filter((locationId) => locationId !== id))
    } else {
      setSelectedLocations([...selectedLocations, id])
    }
  }

  // Handle select all locations
  const handleSelectAll = () => {
    if (selectedLocations.length === locations.length) {
      setSelectedLocations([])
    } else {
      setSelectedLocations(locations.map((location) => location.id))
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

  // Open add location modal
  const openAddModal = () => {
    setLocationForm({
      code: "",
      name: "",
      fullname:"",
      Region: "",
      WCI_URL: "",
      Remarks: "",
    })
    setAddModalOpen(true)
  }

  // Open edit location modal
  const openEditModal = (location: LocationForm) => {
    setCurrentLocation(location)
    setLocationForm({
      code: location.code,
      name: location.name,
      fullname: location.fullname,
      Region: location.Region,
      WCI_URL: location.WCI_URL,
      Remarks: location.Remarks,
    })
    setEditModalOpen(true)
  }

  // Open delete location modal
  const openDeleteModal = (location: any) => {
    setCurrentLocation(location)
    setDeleteModalOpen(true)
  }

  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLocationForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle add location
  const handleAddLocation = async () => {
    if (!locationForm.code || !locationForm.name) {
      toast.error("Code and name are required")
      return
    }

    try {
      await addLocation({
        code: locationForm.code,
        name: locationForm.name,
        fullname: locationForm.fullname,
        Region: locationForm.Region,
        WCI_URL: locationForm.WCI_URL,
        Remarks: locationForm.Remarks
      })

      toast.success("Location added successfully")
      setAddModalOpen(false)
      fetchLocations()
      router.refresh()
    } catch (error: any) {
      if (error.message?.includes("Unique constraint")) {
        toast.error("Location code already exists")
      } else {
        toast.error("Failed to add location")
      }
    }
  }

  // Handle update location
  const handleUpdateLocation = async () => {
    if (!currentLocation || !locationForm.code || !locationForm.name) {
      toast.error("Code and name are required")
      return
    }

    try {
      await updateLocation({
        id: currentLocation.id,
        code: locationForm.code,
        name: locationForm.name,
        fullname: locationForm.fullname,
        Region: locationForm.Region,
        WCI_URL: locationForm.WCI_URL,
        Remarks: locationForm.Remarks

      })

      toast.success("Location updated successfully")
      setEditModalOpen(false)
      fetchLocations()
      router.refresh()
    } catch (error: any) {
      if (error.message?.includes("Unique constraint")) {
        toast.error("Location code already exists")
      } else {
        toast.error("Failed to update location")
      }
    }
  }

  // Handle delete location
  const handleDeleteLocation = async () => {
    if (!currentLocation) return

    try {
      await deleteLocation(currentLocation.id)
      toast.success("Location deleted successfully")
      setDeleteModalOpen(false)
      fetchLocations()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete location")
    }
  }

  // Handle delete selected locations
  const handleDeleteSelected = async () => {
    if (!selectedLocations.length) return

    try {
      // Delete each selected location
      await Promise.all(selectedLocations.map((id) => deleteLocation(id)))
      toast.success(`Deleted ${selectedLocations.length} locations`)
      setSelectedLocations([])
      fetchLocations()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete locations")
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
  const formatDate = (date: Date | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search locations..."
              className="pl-8 w-[200px] sm:w-[300px]"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchLocations()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Location
          </Button>

          {selectedLocations.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete ({selectedLocations.length})
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
                  checked={locations.length > 0 && selectedLocations.length === locations.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[180px]">Create Date</TableHead>
              <TableHead className="w-[120px]">Create By</TableHead>
              <TableHead className="w-[180px]">Modify Date</TableHead>
              <TableHead className="w-[120px]">Modify By</TableHead>
              <TableHead className="w-[120px]">Fullname</TableHead>
              <TableHead className="w-[120px]">Region</TableHead>
              <TableHead className="w-[120px]">WCI_URL</TableHead>
              <TableHead className="w-[120px]">Remarks</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No locations found.
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLocations.includes(location.id)}
                      onCheckedChange={() => handleSelectLocation(location.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{location.code}</TableCell>
                  <TableCell>{location.name}</TableCell>
                  <TableCell>{formatDate(location.createDate)}</TableCell>
                  <TableCell>{location.createBy}</TableCell>
                  <TableCell>{formatDate(location.modifyDate)}</TableCell>
                  <TableCell>{location.modifyBy || "—"}</TableCell>
                  <TableCell>{location.fullname || "—"}</TableCell>
                  <TableCell>{location.Region || "—"}</TableCell>
                  <TableCell>{location.WCI_URL || "—"}</TableCell>
                  <TableCell>{location.Remarks || "—"}</TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(location)} title="Edit Location">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(location)}
                        title="Delete Location"
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
            Showing {locations.length} of {totalItems} results
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

      {/* Add Location Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>Enter the details for the new location.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                name="code"
                value={locationForm.code}
                onChange={handleFormChange}
                className="col-span-3"
                maxLength={10}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={locationForm.name}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullname" className="text-right">
                Fullname <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullname"
                name="fullname"
                value={locationForm.fullname}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Region" className="text-right">
                Region <span className="text-red-500">*</span>
              </Label>
              <Input
                id="Region"
                name="Region"
                value={locationForm.Region}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="WCI_URL" className="text-right">
                WCI_URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="WCI_URL"
                name="WCI_URL"
                value={locationForm.WCI_URL}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="Remarks" className="text-right">
                Remarks <span className="text-red-500">*</span>
              </Label>
              <Input
                id="Remarks"
                name="Remarks"
                value={locationForm.Remarks}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLocation}>Add Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update the location details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-code" className="text-right">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-code"
                name="code"
                value={locationForm.code}
                onChange={handleFormChange}
                className="col-span-3"
                maxLength={10}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={locationForm.name}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-fullname" className="text-right">
                Fullname <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-fullname"
                name="fullname"
                value={locationForm.fullname}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-Region" className="text-right">
                Region <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-Region"
                name="Region"
                value={locationForm.Region}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-WCI_URL" className="text-right">
                WCI_URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-WCI_URL"
                name="WCI_URL"
                value={locationForm.WCI_URL}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-Remarks" className="text-right">
                Remarks <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-Remarks"
                name="Remarks"
                value={locationForm.Remarks}
                onChange={handleFormChange}
                className="col-span-3"
                required
              />
            </div>       
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLocation}>Update Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Location Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the location "{currentLocation?.name}" ({currentLocation?.code})? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLocation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

