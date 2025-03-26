"use client"

import { useState } from "react"
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
})

type FormValues = z.infer<typeof formSchema>

export function AddLibraryEntryDialog({ isOpen, onClose, onSuccess }: AddLibraryEntryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    },
  })

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)

      await createLibraryEntry({
        ...values,
        author: values.author ?? null,
        remarks: values.remarks ?? null,
        attachmentUrl: values.attachmentUrl ?? null,
        pubYear: values.pubYear ?? null,
        creationDate: new Date(),
        borrower: null,
        loanDate: null,
      })
      

      toast.success("Library entry created successfully")
      form.reset()
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
            <Label htmlFor="attachmentUrl">Attachment URL</Label>
            <Input id="attachmentUrl" {...form.register("attachmentUrl")} placeholder="Enter URL to PDF or document" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" {...form.register("remarks")} placeholder="Additional notes or remarks" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

