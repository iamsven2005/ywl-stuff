"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { IframePreview } from "./iframe-preview"
import { getPages, getPageById } from "../actions/page-actions"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CookieDisplay } from "./cookie-display"
import { toast } from "sonner"
import TextBoxCopyStepper from "./TextBoxCopyStepper"

interface Page {
  id: number
  notes: string | null
}

interface PageBrowserClientProps {
  initialPages: Page[]
  baseUrl: string
}

export function PageBrowserClient({ initialPages, baseUrl }: PageBrowserClientProps) {
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [currentPageId, setCurrentPageId] = useState<number>(
    initialPages.length > 0 ? (initialPages[0].id === 1 ? 1 : initialPages[0].id) : 1,
  )
  const [currentPage, setCurrentPage] = useState<Page | null>(initialPages[0] || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingPage, setIsFetchingPage] = useState(false)
  const [filter, setFilter] = useState("")

  const loadPages = async (filterValue?: string) => {
    setIsLoading(true)
    try {
      const result = await getPages(filterValue)
      if (result.error) {
        toast.error(result.error)
      } else if (result.pages) {
        setPages(result.pages)
        // If current page is not in the filtered results, select the first page
        if (result.pages.length > 0 && !result.pages.some((p) => p.id === currentPageId)) {
          setCurrentPageId(result.pages[0].id)
        }
      }
    } catch (error) {
      toast.error("Failed to load pages")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentPage = async () => {
    if (!currentPageId) return

    setIsFetchingPage(true)
    try {
      const result = await getPageById(currentPageId)
      if (result.error) {
        toast.error(result.error)
      } else if (result.page) {
        setCurrentPage(result.page)
      }
    } catch (error) {
      toast.error("Failed to load page details")
    } finally {
      setIsFetchingPage(false)
    }
  }

  const handlePageSelect = (id: number) => {
    setCurrentPageId(id)
  }

  const handleFilter = (filterValue: string) => {
    setFilter(filterValue)
    loadPages(filterValue)
  }

  const goToNextPage = () => {
    const currentIndex = pages.findIndex((p) => p.id === currentPageId)
    if (currentIndex < pages.length - 1) {
      setCurrentPageId(pages[currentIndex + 1].id)
    }
  }

  const goToPreviousPage = () => {
    const currentIndex = pages.findIndex((p) => p.id === currentPageId)
    if (currentIndex > 0) {
      setCurrentPageId(pages[currentIndex - 1].id)
    }
  }

  // Load current page when currentPageId changes
  useEffect(() => {
    loadCurrentPage()
  }, [currentPageId])

  // Get current page index for navigation
  const currentIndex = pages.findIndex((p) => p.id === currentPageId)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < pages.length - 1 && currentIndex !== -1

  return (
    <div className="flex h-screen">
      <Sidebar
        pages={pages}
        selectedPageId={currentPageId}
        onSelectPage={handlePageSelect}
        filter={filter}
        onFilterChange={handleFilter}
        isLoading={isLoading}
      />

      <div className="flex-1 flex flex-col">
        <div className="p-2 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!hasPrevious}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <TextBoxCopyStepper/>
            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!hasNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
            <span className="text-sm text-gray-500">
              Page {currentIndex + 1} of {pages.length}
            </span>
          </div>

          <CookieDisplay />
        </div>

        {currentPage ? (
          <IframePreview
            pageId={currentPage.id}
            baseUrl={baseUrl}
            notes={currentPage.notes}
            onRefresh={loadCurrentPage}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            {isFetchingPage ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
                <span>Loading page...</span>
              </div>
            ) : (
              <p>No page selected or available</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

