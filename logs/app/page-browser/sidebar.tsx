"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Page {
  id: number
  notes: string | null
}

interface SidebarProps {
  pages: Page[]
  selectedPageId: number | null
  onSelectPage: (id: number) => void
  filter: string
  onFilterChange: (filter: string) => void
  isLoading?: boolean
}

export function Sidebar({
  pages,
  selectedPageId,
  onSelectPage,
  filter,
  onFilterChange,
  isLoading = false,
}: SidebarProps) {
  const [tempFilter, setTempFilter] = useState(filter)

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilterChange(tempFilter)
  }

  const clearFilter = () => {
    setTempFilter("")
    onFilterChange("")
  }

  return (
    <div className="w-64 border-r h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 border-b">
        <form onSubmit={handleFilterSubmit} className="space-y-2">
          <div className="relative">
            <Input
              placeholder="Filter by notes..."
              value={tempFilter}
              onChange={(e) => setTempFilter(e.target.value)}
              className="pr-8"
            />
            {tempFilter && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={clearFilter}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button type="submit" size="sm" variant="secondary" className="w-full">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="p-2">
            {pages.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {filter ? "No matching pages found" : "No pages available"}
              </div>
            ) : (
              <ul className="space-y-1">
                {pages.map((page) => (
                  <li key={page.id}>
                    <Button
                      variant={selectedPageId === page.id ? "default" : "ghost"}
                      className={`w-full justify-start h-auto py-2 ${selectedPageId === page.id ? "bg-blue-600" : ""}`}
                      onClick={() => onSelectPage(page.id)}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-mono text-sm">Page #{page.id}</span>
                        {page.notes && (
                          <span className="text-xs opacity-80 truncate w-full mt-1">
                            {page.notes.substring(0, 30)}
                            {page.notes.length > 30 ? "..." : ""}
                          </span>
                        )}
                      </div>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t bg-gray-100 dark:bg-gray-800">
        <div className="text-xs text-gray-500 flex justify-between">
          <span>
            {pages.length} page{pages.length !== 1 ? "s" : ""}
          </span>
          {filter && <span>Filter: "{filter}"</span>}
        </div>
      </div>
    </div>
  )
}

