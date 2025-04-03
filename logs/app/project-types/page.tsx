"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getAllProjectTypes, createProjectType, updateProjectType, deleteProjectType } from "./actions"

interface ProjectType {
  id: number
  name: string
  description: string | null
  _count?: {
    projects: number
  }
}

export default function ProjectTypesPage() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [currentProjectType, setCurrentProjectType] = useState<ProjectType | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")

  useEffect(() => {
    fetchProjectTypes()
  }, [])

  const fetchProjectTypes = async () => {
    try {
      setLoading(true)
      const data = await getAllProjectTypes(searchQuery)
      setProjectTypes(data)
    } catch (error) {
      toast.error("Failed to fetch project types")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProjectTypes()
  }

  const openAddModal = () => {
    setFormName("")
    setFormDescription("")
    setIsAddModalOpen(true)
  }

  const openEditModal = (projectType: ProjectType) => {
    setCurrentProjectType(projectType)
    setFormName(projectType.name)
    setFormDescription(projectType.description || "")
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (projectType: ProjectType) => {
    setCurrentProjectType(projectType)
    setIsDeleteModalOpen(true)
  }

  const handleAddProjectType = async () => {
    try {
      await createProjectType({
        name: formName,
        description: formDescription,
      })
      toast.success("Project type created successfully")
      setIsAddModalOpen(false)
      fetchProjectTypes()
    } catch (error) {
      toast.error("Failed to create project type")
      console.error(error)
    }
  }

  const handleEditProjectType = async () => {
    if (!currentProjectType) return

    try {
      await updateProjectType(currentProjectType.id, {
        name: formName,
        description: formDescription,
      })
      toast.success("Project type updated successfully")
      setIsEditModalOpen(false)
      fetchProjectTypes()
    } catch (error) {
      toast.error("Failed to update project type")
      console.error(error)
    }
  }

  const handleDeleteProjectType = async () => {
    if (!currentProjectType) return

    try {
      await deleteProjectType(currentProjectType.id)
      toast.success("Project type deleted successfully")
      setIsDeleteModalOpen(false)
      fetchProjectTypes()
    } catch (error) {
      toast.error("Failed to delete project type")
      console.error(error)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Project Types</h1>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project Type
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Project Types</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search project types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : projectTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No project types found
                </TableCell>
              </TableRow>
            ) : (
              projectTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.description || "-"}</TableCell>
                  <TableCell>{type._count?.projects || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(type)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteModal(type)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Project Type Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Project Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter project type name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddProjectType}>Add Project Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Type Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Project Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditProjectType}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Type Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Project Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the project type "{currentProjectType?.name}"?
              {currentProjectType?._count?.projects ? (
                <span className="text-red-500 font-semibold block mt-2">
                  Warning: This project type is assigned to {currentProjectType._count.projects} project(s).
                </span>
              ) : null}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProjectType}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

