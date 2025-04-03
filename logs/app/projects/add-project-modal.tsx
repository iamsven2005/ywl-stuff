"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createProject } from "./actions"

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [businessCode, setBusinessCode] = useState("")
  const [projectCode, setProjectCode] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateProject = async () => {
    try {
      setLoading(true)
      await createProject({
        businessCode,
        projectCode,
        name,
      })
      toast.success("Project created successfully")
      onSuccess() // Refresh project data
      onClose()
    } catch (error) {
      console.error("Failed to create project:", error)
      toast.error("Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Label htmlFor="businessCode">Business Code</Label>
          <Input
            id="businessCode"
            value={businessCode}
            onChange={(e) => setBusinessCode(e.target.value)}
            placeholder="e.g., YWL"
          />

          <Label htmlFor="projectCode">Project Code</Label>
          <Input
            id="projectCode"
            value={projectCode}
            onChange={(e) => setProjectCode(e.target.value)}
            placeholder="e.g., 00001"
          />

          <Label htmlFor="name">Project Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter project name" />
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleCreateProject} disabled={loading}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

