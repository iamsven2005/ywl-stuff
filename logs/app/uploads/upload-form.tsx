"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { parseBookData } from "./parser"
import { BookList } from "./book-list"
import Book from "./types"

export default function UploadForm() {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setFileName(file.name)

    try {
      const text = await file.text()
      const extractedBooks = parseBookData(text)
      setBooks(extractedBooks)
      console.log("Extracted books:", extractedBooks)
    } catch (error) {
      console.error("Error parsing HTML:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="html-file" className="text-sm font-medium">
              Select HTML File
            </label>
            <input
              id="html-file"
              type="file"
              accept=".html"
              onChange={handleFileUpload}
              className="border rounded p-2"
            />
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Processing file...</p>
            </div>
          )}

          {fileName && !isLoading && (
            <div className="text-sm text-gray-600">
              Processed file: <span className="font-medium">{fileName}</span>
            </div>
          )}
        </div>
      </Card>

      {books.length > 0 && <BookList books={books} />}
    </div>
  )
}

