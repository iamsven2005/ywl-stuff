"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, FileCheck, Save, Check, AlertCircle } from "lucide-react"
import { saveBooksToDB } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Book from "./types"

interface BookListProps {
  books: Book[]
}
interface SaveBooksResponse {
    success: boolean
    message: string
    count: number
  }
  
export function BookList({ books }: BookListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<SaveBooksResponse | null>(null)

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.refNo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSaveToDB = async () => {
    if (books.length === 0) return

    setIsSaving(true)
    setSaveResult(null)

    try {
      const result = await saveBooksToDB(books)
      setSaveResult(result)
    } catch (error) {
      setSaveResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        count: 0,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Extracted Books ({books.length})</CardTitle>
          <Button onClick={handleSaveToDB} disabled={isSaving || books.length === 0} className="w-full md:w-auto">
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save to Database
              </>
            )}
          </Button>
        </div>

        {saveResult && (
          <Alert className={`mt-4 ${saveResult.success ? "bg-green-50" : "bg-red-50"}`}>
            {saveResult.success ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle className={saveResult.success ? "text-green-800" : "text-red-800"}>
              {saveResult.success ? "Success" : "Error"}
            </AlertTitle>
            <AlertDescription>{saveResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4">
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PDF</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ref No.</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Pub. Year</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.map((book, index) => (
                <TableRow key={index} className={book.isBorrowed ? "bg-amber-50" : ""}>
                  <TableCell>
                    {book.hasPdf ? (
                      <FileCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-300" />
                    )}
                  </TableCell>
                  <TableCell>{book.category}</TableCell>
                  <TableCell>{book.refNo}</TableCell>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.pubYear}</TableCell>
                  <TableCell>
                    {book.isBorrowed ? (
                      <span className="text-amber-600">Borrowed by {book.borrower}</span>
                    ) : (
                      <span className="text-green-600">Available</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredBooks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    No books found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

