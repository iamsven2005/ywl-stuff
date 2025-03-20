"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { toast } from "sonner"
import { Search, RefreshCw, Trash2, Edit, Plus, FileText, Download } from "lucide-react"
import { getNotes, deleteMultipleNotes } from "../actions/note-actions"
import { exportToExcel } from "../export-utils"
import { NoteEditor } from "../note-editor"

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

export default function NotesTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedNotes, setSelectedNotes] = useState<number[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Modal states
  const [editorModalOpen, setEditorModalOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState<any | null>(null)
  const [isCreating, setIsCreating] = useState(false)

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

  const fetchNotes = async () => {
    setIsLoading(true)
    try {
      const result = await getNotes({
        search: debouncedSearchQuery,
        page: currentPage,
        pageSize: pageSize,
      });
  
      if (result) {
        setNotes(result.notes || []); // If notes are null, set to an empty array
        setTotalPages(result.pageCount || 1); // Default to 1 if null
        setTotalItems(result.totalCount || 0); // Default to 0 if null
      } else {
        // Handle null response gracefully
        setNotes([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      toast.error("Failed to fetch notes");
      setNotes([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };
  

  // Load notes when filters or pagination changes
  useEffect(() => {
    fetchNotes()
  }, [debouncedSearchQuery, currentPage, pageSize])

  // Handle note selection
  const handleSelectNote = (id: number) => {
    if (selectedNotes.includes(id)) {
      setSelectedNotes(selectedNotes.filter((noteId) => noteId !== id))
    } else {
      setSelectedNotes([...selectedNotes, id])
    }
  }

  // Handle select all notes
  const handleSelectAll = () => {
    if (selectedNotes.length === notes.length) {
      setSelectedNotes([])
    } else {
      setSelectedNotes(notes.map((note) => note.id))
    }
  }

  // Handle delete selected notes
  const handleDeleteSelected = async () => {
    if (!selectedNotes.length) return

    try {
      await deleteMultipleNotes(selectedNotes)
      toast.success(`Deleted ${selectedNotes.length} notes`)
      setSelectedNotes([])
      fetchNotes()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete notes")
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

  // Open create note modal
  const openCreateModal = () => {
    setCurrentNote(null)
    setIsCreating(true)
    setEditorModalOpen(true)
  }

  // Open edit note modal
  const openEditModal = (note: any) => {
    setCurrentNote(note)
    setIsCreating(false)
    setEditorModalOpen(true)
  }

  // Handle note save (create or update)
  const handleNoteSaved = () => {
    setEditorModalOpen(false)
    fetchNotes()
    router.refresh()
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Truncate text for display
  const truncateText = (text: string, maxLength: number) => {
    // Remove HTML tags for display
    const plainText = text.replace(/<[^>]*>?/gm, "")
    if (plainText.length <= maxLength) return plainText
    return plainText.substring(0, maxLength) + "..."
  }

  // Export notes to Excel
  const handleExport = () => {
    if (notes.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = notes.map((note) => ({
        ID: note.id,
        Title: note.title,
        Created: new Date(note.time).toLocaleString(),
        Content: note.description.replace(/<[^>]*>?/gm, ""), // Strip HTML tags
      }))

      exportToExcel(exportData, `notes-export-${new Date().toISOString().split("T")[0]}`)
      toast.success("Notes exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export notes")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes..."
              className="pl-8 w-[200px] sm:w-[300px]"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchNotes()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>

          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>

          {selectedNotes.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete ({selectedNotes.length})
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
                  checked={notes.length > 0 && selectedNotes.length === notes.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[250px]">Title</TableHead>
              <TableHead className="w-[180px]">Created</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No notes found.
                </TableCell>
              </TableRow>
            ) : (
              notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedNotes.includes(note.id)}
                      onCheckedChange={() => handleSelectNote(note.id)}
                    />
                  </TableCell>
                  <TableCell>{note.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{note.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(note.time)}</TableCell>
                  <TableCell>
                    <div className="max-w-[400px] truncate">{truncateText(note.description, 100)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(note)} title="Edit Note">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedNotes([note.id])
                          handleDeleteSelected()
                        }}
                        title="Delete Note"
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
            Showing {notes.length} of {totalItems} results
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

      {/* Note Editor Modal */}
      <Dialog open={editorModalOpen} onOpenChange={setEditorModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Create New Note" : "Edit Note"}</DialogTitle>
            <DialogDescription>
              {isCreating ? "Create a new note with rich text formatting." : "Edit the note content and title."}
            </DialogDescription>
          </DialogHeader>

          <NoteEditor
            note={currentNote}
            isCreating={isCreating}
            onSaved={handleNoteSaved}
            onCancel={() => setEditorModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

