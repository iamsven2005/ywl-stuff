"use client"

import { useState } from "react"
import type { LibraryEntry } from "@prisma/client"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, MoreHorizontal, Pencil, Trash2, FileText, BookUp, BookDown } from "lucide-react"
import { toast } from "sonner"
import { LibraryEntryDetailsModal } from "./library-entry-details-modal"
import { EditLibraryEntryDialog } from "./edit-library-entry-dialog"
import { CheckoutBookDialog } from "./checkout-book-dialog"
import { deleteLibraryEntry } from "../actions/library-actions"

interface LibraryTableProps {
  entries: LibraryEntry[]
  onRefresh: () => void
  isAdmin: boolean
}

export function LibraryTable({ entries, onRefresh, isAdmin }: LibraryTableProps) {
  // Add useState for selected items at the top of the component
  const [selectedEntries, setSelectedEntries] = useState<number[]>([])
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false)

  // Add a function to handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedEntries.length === 0) return

    if (
      confirm(
        `Are you sure you want to delete ${selectedEntries.length} selected entries? This action cannot be undone.`,
      )
    ) {
      try {
        setIsBulkDeleting(true)

        // Delete entries one by one
        for (const id of selectedEntries) {
          await deleteLibraryEntry(id)
        }

        toast.success(`Successfully deleted ${selectedEntries.length} entries`)
        setSelectedEntries([])
        onRefresh()
      } catch (error) {
        console.error("Error bulk deleting library entries:", error)
        toast.error("Failed to delete some entries")
      } finally {
        setIsBulkDeleting(false)
      }
    }
  }

  // Add a function to toggle selection of a single entry
  const toggleEntrySelection = (id: number) => {
    setSelectedEntries((prev) => (prev.includes(id) ? prev.filter((entryId) => entryId !== id) : [...prev, id]))
  }

  // Add a function to toggle selection of all entries
  const toggleSelectAll = () => {
    if (selectedEntries.length === entries.length) {
      setSelectedEntries([])
    } else {
      setSelectedEntries(entries.map((entry) => entry.id))
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this library entry? This action cannot be undone.")) {
      try {
        setIsDeleting(id)
        await deleteLibraryEntry(id)
        toast.success("Library entry deleted successfully")
        onRefresh()
      } catch (error) {
        console.error("Error deleting library entry:", error)
        toast.error("Failed to delete library entry")
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const openEntryDetails = (entry: LibraryEntry) => {
    setSelectedEntry(entry)
    setIsDetailsModalOpen(true)
  }

  const openEditDialog = (entry: LibraryEntry) => {
    setSelectedEntry(entry)
    setIsEditDialogOpen(true)
  }

  const openCheckoutDialog = (entry: LibraryEntry) => {
    setSelectedEntry(entry)
    setIsCheckoutDialogOpen(true)
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 rounded-md">
        <p className="text-lg font-medium">No library entries found</p>
        <p className="text-sm text-gray-500">Try adjusting your search filters</p>
      </div>
    )
  }

  return (
    <>
      {selectedEntries.length > 0 && (
        <div className="bg-blue-50 p-3 mb-4 rounded-md flex justify-between items-center">
          <span className="font-medium">
            {selectedEntries.length} {selectedEntries.length === 1 ? "entry" : "entries"} selected
          </span>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? (
                <>
                  <span className="mr-2">Deleting...</span>
                  <span className="animate-spin">⟳</span>
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedEntries([])}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left border border-blue-200">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={entries.length > 0 && selectedEntries.length === entries.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all entries"
                />
              </th>
              <th className="p-2 text-left border border-blue-200">PDF</th>
              <th className="p-2 text-left border border-blue-200">Category</th>
              <th className="p-2 text-left border border-blue-200">Ref No.</th>
              <th className="p-2 text-left border border-blue-200">Title</th>
              <th className="p-2 text-left border border-blue-200">Author</th>
              <th className="p-2 text-left border border-blue-200">Pub. Year</th>
              <th className="p-2 text-left border border-blue-200">Creation Date</th>
              <th className="p-2 text-left border border-blue-200">Borrower</th>
              <th className="p-2 text-left border border-blue-200">Loan Date</th>
              <th className="p-2 text-left border border-blue-200">Remarks</th>
              <th className="p-2 text-center border border-blue-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className={selectedEntries.includes(entry.id) ? "bg-blue-50" : ""}>
                <td className="p-2 border border-gray-200 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={selectedEntries.includes(entry.id)}
                    onChange={() => toggleEntrySelection(entry.id)}
                    aria-label={`Select entry ${entry.title}`}
                  />
                </td>
                <td className="p-2 border border-gray-200 text-center">
                  {entry.attachmentUrl && (
                    <a
                      href={entry.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4 inline" />
                    </a>
                  )}
                </td>
                <td className="p-2 border border-gray-200">{entry.category}</td>
                <td className="p-2 border border-gray-200">{entry.refNo}</td>
                <td className="p-2 border border-gray-200 max-w-[300px] truncate">{entry.title}</td>
                <td className="p-2 border border-gray-200">{entry.author || "—"}</td>
                <td className="p-2 border border-gray-200">{entry.pubYear || "—"}</td>
                <td className="p-2 border border-gray-200">
                  {entry.creationDate && format(new Date(entry.creationDate), "yyyy-MM-dd")}
                </td>
                <td className="p-2 border border-gray-200">
                  {entry.borrower ? (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      {entry.borrower}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                      Available
                    </Badge>
                  )}
                </td>
                <td className="p-2 border border-gray-200">
                  {entry.loanDate && format(new Date(entry.loanDate), "yyyy-MM-dd")}
                </td>
                <td className="p-2 border border-gray-200 max-w-[200px] truncate">{entry.remarks}</td>
                <td className="p-2 border border-gray-200 text-center">
                  {isAdmin ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEntryDetails(entry)}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {entry.borrower ? (
                          <DropdownMenuItem onClick={() => openCheckoutDialog(entry)}>
                            <BookDown className="mr-2 h-4 w-4" />
                            Return Book
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => openCheckoutDialog(entry)}>
                            <BookUp className="mr-2 h-4 w-4" />
                            Check Out
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(entry.id)}
                          disabled={isDeleting === entry.id}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting === entry.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => openEntryDetails(entry)}>
                      <BookOpen className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      <LibraryEntryDetailsModal
        entry={selectedEntry}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onUpdate={onRefresh}
        isAdmin={isAdmin}
      />

      {/* Edit Dialog - Admin Only */}
      {isAdmin && selectedEntry && (
        <EditLibraryEntryDialog
          entry={selectedEntry}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={onRefresh}
        />
      )}

      {/* Checkout Dialog - Admin Only */}
      {isAdmin && selectedEntry && (
        <CheckoutBookDialog
          book={selectedEntry}
          isOpen={isCheckoutDialogOpen}
          onClose={() => setIsCheckoutDialogOpen(false)}
          onSuccess={onRefresh}
        />
      )}
    </>
  )
}

