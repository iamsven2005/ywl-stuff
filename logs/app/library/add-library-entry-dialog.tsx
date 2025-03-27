"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createLibraryEntry } from "@/app/actions/library-actions"
import { Loader2 } from "lucide-react"

interface AddLibraryEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const formSchema = z.object({
  refNo: z.string().min(1, "Reference number is required"),
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  author: z.string().optional(),
  pubYear: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val) : undefined)),
  remarks: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentFilename: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function AddLibraryEntryDialog({ isOpen, onClose, onSuccess }: AddLibraryEntryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      refNo: "",
      title: "",
      category: "",
      author: "",
      pubYear: undefined, // ✅ or null if your schema prefers it
      remarks: "",
      attachmentUrl: "",
      attachmentFilename: "",
    },
  })


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const uploadFile = async (entryId: number): Promise<string | null> => {
    if (!selectedFile) return null

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("entryId", entryId.toString())

      const response = await fetch("/api/library-upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file")
      }

      return data.url
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload PDF file")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)

      // Create the library entry first
      const entry = await createLibraryEntry({
        ...values,
        author: values.author ?? null,
        pubYear: values.pubYear ?? null,
        remarks: values.remarks ?? null,
        attachmentUrl: values.attachmentUrl ?? null,
        attachmentFilename: values.attachmentFilename ?? null,
        creationDate: new Date(),
        borrower: null,
        loanDate: null,
      })
      

      // If a file was selected, upload it and update the entry
      if (selectedFile && entry.id) {
        const fileUrl = await uploadFile(entry.id)

        if (fileUrl) {
          // The API already updates the entry with the attachment URL
          toast.success("Library entry created with PDF attachment")
        } else {
          toast.success("Library entry created, but PDF upload failed")
        }
      } else {
        toast.success("Library entry created successfully")
      }

      // Reset form and state
      form.reset()
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating library entry:", error)
      toast.error("Failed to create library entry")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Library Entry</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="refNo">Reference Number *</Label>
              <Input id="refNo" {...form.register("refNo")} placeholder="e.g., 0001" />
              {form.formState.errors.refNo && (
                <p className="text-sm text-red-500">{form.formState.errors.refNo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input id="category" {...form.register("category")} placeholder="e.g., PM9" />
              {form.formState.errors.category && (
                <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...form.register("title")} placeholder="Enter book title" />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input id="author" {...form.register("author")} placeholder="Enter author name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pubYear">Publication Year</Label>
              <Input id="pubYear" type="number" {...form.register("pubYear")} placeholder="e.g., 2023" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdfUpload">PDF Document</Label>
            <div className="flex items-center gap-2">
              <Input
                id="pdfUpload"
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="flex-1"
              />
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" {...form.register("remarks")} placeholder="Additional notes or remarks" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading PDF..." : "Creating..."}
                </>
              ) : (
                "Create Entry"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}