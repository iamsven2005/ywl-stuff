"use client"

import { useState, useRef, SetStateAction, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function NdaUploadForm({ user}: any) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }
  

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsSubmitting(true)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("userId", user.id.toString())

      // Use the API route instead of server action
      const response = await fetch("/api/nda-upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Your NDA document has been uploaded successfully.")

        // Reset the file input
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        // Refresh the page to show the updated document
        router.refresh()
      } else {
        toast.error("Failed to upload document")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Upload error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {user.ndafile && (
        <div>
          <h3 className="font-medium mb-2">Current Document</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Document</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{user.username}</TableCell>
                <TableCell>{new Date(user.updatedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <a
                    href={`/api/nda-document/${user.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <svg className="w-6 h-6 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                      <path d="M3 8a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    View Document
                  </a>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <div className="border p-4 rounded-md">
        <p className="text-blue-600 mb-4">
          By clicking the "Upload" button below, I hereby agree to and accept the terms and conditions as defined in the
          Non-Disclosure Agreement document.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Button
            type="button"
            variant="secondary"
            className="bg-blue-400 text-white hover:bg-blue-500"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload PDF document
          </Button>

          <div className="flex-1">
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            <div className="border rounded px-3 py-2 text-gray-500">
              {selectedFile ? selectedFile.name : "No file chosen"}
            </div>
          </div>

          {selectedFile && (
            <Button type="button" onClick={handleUpload} disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload"}
            </Button>
          )}
        </div>

        {!user.ndafile && (
          <div className="flex items-center gap-2 mt-4 text-amber-600">
            <AlertCircle size={16} />
            <span>You have not uploaded an NDA document yet.</span>
          </div>
        )}
      </div>
    </div>
  )
}

