"use client"

import { useState } from "react"
import { FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createFolder } from "../actions/drive-actions"
import { toast } from "sonner"

interface CreateFolderButtonProps {
  parentId: number | null
  onFolderCreated: () => Promise<void>
}

export function CreateFolderButton({ parentId, onFolderCreated }: CreateFolderButtonProps) {
  const [folderName, setFolderName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [open, setOpen] = useState(false)

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error("Folder name cannot be empty")
      return
    }

    setIsCreating(true)

    try {
      await createFolder(folderName, parentId)
      await fetch("/api/drive-events", {
        method: "POST",
        body: JSON.stringify({ type: "folder_created" }),
        headers: { "Content-Type": "application/json" }
      })      
      toast.success("Folder created successfully")
      setFolderName("")
      setOpen(false)
      await onFolderCreated()
    } catch (error) {
      toast.error("Failed to create folder")
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateFolder()
                }
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleCreateFolder} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

