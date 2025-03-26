"use client"
import { useState } from "react"
import type { LibraryEntry } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { format } from "date-fns"
import { LibraryEntryDetailsModal } from "./library-entry-details-modal"

interface LibraryEntryListProps {
  entries: LibraryEntry[]
  onRefresh: () => void
  isAdmin: boolean
}

export function LibraryEntryList({ entries, onRefresh, isAdmin }: LibraryEntryListProps) {
  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openEntryDetails = (entry: LibraryEntry) => {
    setSelectedEntry(entry)
    setIsModalOpen(true)
  }

  const closeEntryDetails = () => {
    setIsModalOpen(false)
  }

  const handleEntryUpdate = () => {
    onRefresh()
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-xl font-semibold">No books found</p>
        <p className="text-muted-foreground">Try adjusting your search filters</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100">
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
              <th className="p-2 text-left border border-blue-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="p-2 border border-gray-200">
                  {entry.attachmentUrl && (
                    <a href={entry.attachmentUrl} target="_blank" rel="noopener noreferrer">
                      PDF
                    </a>
                  )}
                </td>
                <td className="p-2 border border-gray-200">{entry.category}</td>
                <td className="p-2 border border-gray-200">{entry.refNo}</td>
                <td className="p-2 border border-gray-200">{entry.title}</td>
                <td className="p-2 border border-gray-200">{entry.author}</td>
                <td className="p-2 border border-gray-200">{entry.pubYear}</td>
                <td className="p-2 border border-gray-200">
                  {entry.creationDate && format(new Date(entry.creationDate), "yyyy-MM-dd")}
                </td>
                <td className="p-2 border border-gray-200">{entry.borrower}</td>
                <td className="p-2 border border-gray-200">
                  {entry.loanDate && format(new Date(entry.loanDate), "yyyy-MM-dd")}
                </td>
                <td className="p-2 border border-gray-200">{entry.remarks}</td>
                <td className="p-2 border border-gray-200">
                  <Button variant="outline" size="sm" onClick={() => openEntryDetails(entry)}>
                    <BookOpen className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LibraryEntryDetailsModal
      isAdmin={isAdmin}
        entry={selectedEntry}
        isOpen={isModalOpen}
        onClose={closeEntryDetails}
        onUpdate={handleEntryUpdate}
      />
    </>
  )
}

