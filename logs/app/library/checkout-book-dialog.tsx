"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { checkoutBook, returnBook } from "@/app/actions/library-actions"
import type { LibraryEntry } from "@prisma/client"
import { format } from "date-fns"

interface CheckoutBookDialogProps {
  book: LibraryEntry
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const checkoutSchema = z.object({
  borrower: z.string().min(1, "Borrower name is required"),
})

export function CheckoutBookDialog({ book, isOpen, onClose, onSuccess }: CheckoutBookDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<{ borrower: string }>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      borrower: book.borrower || "",
    },
  })

  const handleCheckout = async (values: { borrower: string }) => {
    try {
      setIsSubmitting(true)

      await checkoutBook(book.id, values.borrower)

      toast.success("Book checked out successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error checking out book:", error)
      toast.error("Failed to check out book")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReturn = async () => {
    try {
      setIsSubmitting(true)

      await returnBook(book.id)

      toast.success("Book returned successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error returning book:", error)
      toast.error("Failed to return book")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{book.borrower ? "Return Book" : "Check Out Book"}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <h3 className="font-medium text-lg">{book.title}</h3>
            <p className="text-sm text-muted-foreground">
              {book.category} | {book.refNo}
            </p>
          </div>

          {book.borrower ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p className="font-medium">Currently borrowed by: {book.borrower}</p>
                {book.loanDate && (
                  <p className="text-sm text-muted-foreground">Loan date: {format(new Date(book.loanDate), "PPP")}</p>
                )}
              </div>

              <p>Are you sure you want to mark this book as returned?</p>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleReturn} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                  {isSubmitting ? "Processing..." : "Confirm Return"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="borrower">Borrower Name *</Label>
                <Input id="borrower" {...form.register("borrower")} placeholder="Enter borrower name" />
                {form.formState.errors.borrower && (
                  <p className="text-sm text-red-500">{form.formState.errors.borrower.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Check Out"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

