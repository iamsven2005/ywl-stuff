"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LibrarySearchFilters } from "./library-search-filters"
import { LibraryTable } from "./library-table"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import type { LibraryEntry } from "@prisma/client"
import { AddLibraryEntryDialog } from "./add-library-entry-dialog"

interface LibraryPageProps {
  entries: LibraryEntry[]
  total: number
  totalPages: number
  currentPage: number
  isAdmin: boolean
}

export function LibraryPage({ entries, total, totalPages, currentPage, isAdmin }: LibraryPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleSearch = (filters: any) => {
    const params = new URLSearchParams()

    if (filters.search) params.set("search", filters.search)
    if (filters.category && filters.category !== "all") params.set("category", filters.category)
    if (filters.pubYearFrom) params.set("pubYearFrom", filters.pubYearFrom.toString())
    if (filters.pubYearTo) params.set("pubYearTo", filters.pubYearTo.toString())
    if (filters.creationDateFrom) params.set("creationDateFrom", filters.creationDateFrom.toISOString())
    if (filters.creationDateTo) params.set("creationDateTo", filters.creationDateTo.toISOString())
    if (filters.sortBy) params.set("sortBy", filters.sortBy)
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder)
    if (filters.hasAttachment !== undefined) params.set("hasAttachment", filters.hasAttachment.toString())
    params.set("page", "1") // Reset to first page on new search

    router.push(`/library?${params.toString()}`)
  }

  const handleRefresh = () => {
    router.refresh()
  }

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set("page", page.toString())
    router.push(`/library?${newParams.toString()}`)
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Library</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          )}
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <LibrarySearchFilters onSearch={handleSearch} />

      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total {total} {total === 1 ? "entry" : "entries"}
        </p>
      </div>

      <LibraryTable entries={entries} onRefresh={handleRefresh} isAdmin={isAdmin} />

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === currentPage ? "default" : "outline"}
                size="sm"
                className={p === currentPage ? "bg-blue-600" : ""}
                onClick={() => handlePageChange(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <AddLibraryEntryDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  )
}

