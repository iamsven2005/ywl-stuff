"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { LibrarySearchFilters } from "./library-search-filters"
import { LibraryEntryList } from "./library-entry-list"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { LibraryEntry } from "@prisma/client"

interface LibraryClientProps {
  entries: LibraryEntry[]
  total: number
  totalPages: number
  currentPage: number
  isAdmin: boolean
}

export function LibraryClient({ entries, total, totalPages, currentPage, isAdmin }: LibraryClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSearch = useCallback(
    (filters: any) => {
      startTransition(() => {
        // Don't add default values to URL
        if (filters.category === "all") filters.category = undefined
        if (filters.hasAttachment === "any") filters.hasAttachment = undefined

        const params = new URLSearchParams()

        if (filters.search) params.set("search", filters.search)
        if (filters.category) params.set("category", filters.category)
        if (filters.pubYearFrom) params.set("pubYearFrom", filters.pubYearFrom.toString())
        if (filters.pubYearTo) params.set("pubYearTo", filters.pubYearTo.toString())
        if (filters.creationDateFrom) params.set("creationDateFrom", filters.creationDateFrom.toISOString())
        if (filters.creationDateTo) params.set("creationDateTo", filters.creationDateTo.toISOString())
        if (filters.sortBy) params.set("sortBy", filters.sortBy)
        if (filters.sortOrder) params.set("sortOrder", filters.sortOrder)
        if (filters.hasAttachment !== undefined) params.set("hasAttachment", filters.hasAttachment.toString())
        params.set("page", "1") // Reset to first page on new search

        router.push(`/library?${params.toString()}`)
      })
    },
    [router],
  )

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Library</h1>
        <Button variant="outline" className="flex items-center gap-2" onClick={handleRefresh} disabled={isPending}>
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <LibrarySearchFilters onSearch={handleSearch} />

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Total {total} {total === 1 ? "entry" : "entries"}
        </p>
      </div>

      <LibraryEntryList entries={entries} onRefresh={handleRefresh} isAdmin={isAdmin} />

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              // Preserve all current search params except page
              const newParams = new URLSearchParams(searchParams.toString())
              newParams.set("page", p.toString())

              return (
                <Button
                  key={p}
                  variant={p === currentPage ? "default" : "outline"}
                  size="sm"
                  className={p === currentPage ? "bg-blue-600" : ""}
                  asChild
                >
                  <a href={`/library?${newParams.toString()}`}>{p}</a>
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

