"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Edit, BarChart, Copy, Trash } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "../hooks/use-toast"
import { copyForm, deleteForm } from "./[id]/actions"

interface FormCardProps {
  form: {
    id: number
    title: string
    description?: string
    createdAt: Date
    questions: any[]
    responses: any[]
  }
}

export function FormCard({ form }: FormCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const handleCopyForm = async () => {
    try {
      setIsCopying(true)
      const newFormId = await copyForm(form.id)
      toast({
        title: "Form copied successfully",
        description: "You can now edit the new form",
      })
      router.push(`/forms/${newFormId}/edit`)
    } catch (error) {
      console.error("Error copying form:", error)
      toast({
        title: "Error copying form",
        description: "Please try again later",
      })
    } finally {
      setIsCopying(false)
    }
  }

  const handleDeleteForm = async () => {
    try {
      setIsDeleting(true)
      await deleteForm(form.id)
      toast({
        title: "Form deleted successfully",
      })
      router.refresh()
    } catch (error) {
      console.error("Error deleting form:", error)
      toast({
        title: "Error deleting form",
        description: "Please try again later",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="line-clamp-1">{form.title}</CardTitle>
        <CardDescription className="line-clamp-2">{form.description || "No description"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">{form.questions.length}</span> questions
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{form.responses.length}</span> responses
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">Created: {new Date(form.createdAt).toLocaleDateString()}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="grid grid-cols-3 gap-2 flex-1">
          <Link href={`/forms/${form.id}`} className="col-span-1">
            <Button variant="outline" className="w-full" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          </Link>
          <Link href={`/forms/${form.id}/edit`} className="col-span-1">
            <Button variant="outline" className="w-full" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/forms/${form.id}/responses`} className="col-span-1">
            <Button variant="outline" className="w-full" size="sm">
              <BarChart className="h-4 w-4 mr-2" />
              Results
            </Button>
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopyForm} disabled={isCopying}>
              <Copy className="h-4 w-4 mr-2" />
              {isCopying ? "Copying..." : "Make a copy"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete form
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the form "{form.title}" and all its responses. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteForm}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}
