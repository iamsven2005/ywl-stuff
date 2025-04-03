"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { createProject } from "./actions"

interface UploadProjectsProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export  default function UploadProjects({ isOpen, onClose, onSuccess }: UploadProjectsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")

  const handleUpload = async () => {
    setIsSubmitting(true)
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, "text/html")
  
      const rows = Array.from(doc.querySelectorAll("table.table_layout tbody tr"))
  
      const projects = rows.map((row) => {
        const cells = row.querySelectorAll("td")
        return {
          businessCode: cells[1]?.textContent?.trim() || "",
          projectCode: cells[2]?.textContent?.trim() || "",
          name: cells[3]?.textContent?.trim() || "",
          // optional: you can also get the create date if needed via cells[4]?.textContent
        }
      }).filter((p) => p.businessCode && p.projectCode && p.name)
  
      if (projects.length === 0) {
        toast.error("No valid project entries found in the HTML.")
        return
      }
  
      for (const project of projects) {
        await createProject(project)
      }
  
      toast.success(`${projects.length} projects uploaded successfully`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error uploading projects:", error)
      toast.error("Failed to upload projects")
    } finally {
      setIsSubmitting(false)
    }
  }
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Projects</DialogTitle>
          <DialogDescription>Upload an HTML file to create multiple projects at once.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Label htmlFor="htmlContent">HTML Content</Label>
          <Textarea
            id="htmlContent"
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="min-h-[200px]"
            placeholder="Paste HTML content here..."
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Upload Projects"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

