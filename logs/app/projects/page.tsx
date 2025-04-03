"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getAllProjects, getProjectTypes, assignProjectType } from "./actions" // Import actions
import type { User } from "@prisma/client"
import { toast } from "sonner"
import { Plus, HardDrive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddProjectModal } from "./add-project-modal"
import { AssignUsersModal } from "./assign-users-modal"
import { ModelEntryModal } from "./model-entry-modal"

interface Project {
  id: number
  businessCode: string
  projectCode: string
  name: string
  createDate: Date
  projectType?: {
    id: number
    name: string
  } | null
  assignments: ProjectAssignment[]
}

interface ProjectType {
  id: number
  name: string
}

interface ProjectAssignment {
  id: number
  userId: number
  projectId: number
  role: string
  user: User
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isModelEntryModalOpen, setIsModelEntryModalOpen] = useState(false)
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData()
    }, 300) // debounce to avoid spamming queries

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projectsData, projectTypesData] = await Promise.all([getAllProjects(searchQuery), getProjectTypes()])
      setProjects(projectsData)
      setProjectTypes(projectTypesData)
    } catch (error) {
      toast.error("Failed to fetch data")
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  const handleProjectTypeChange = async (projectId: number, projectTypeId: string) => {
    try {
      const projectTypeIdNumber = Number.parseInt(projectTypeId)
      await assignProjectType(projectId, projectTypeIdNumber)
      toast.success("Project type assigned successfully")
      fetchData()
    } catch (error) {
      toast.error("Failed to assign project type")
      console.error("Error assigning project type:", error)
    }
  }

  const openAssignModal = (projectId: number) => {
    setSelectedProjectId(projectId)
    setIsAssignModalOpen(true)
  }

  const closeAssignModal = () => {
    setSelectedProjectId(null)
    setIsAssignModalOpen(false)
  }

  const openModelEntryModal = (projectId: number) => {
    setSelectedProjectId(projectId)
    setIsModelEntryModalOpen(true)
  }

  const closeModelEntryModal = () => {
    setSelectedProjectId(null)
    setIsModelEntryModalOpen(false)
  }

  // Function to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString()
  }

  const openAddModal = () => {
    setAddModalOpen(true)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search projects..."
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
              <TableHead>Business Code</TableHead>
              <TableHead>Project Code</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Create Date</TableHead>
              <TableHead>Project Type</TableHead>
              <TableHead>Assigned Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.businessCode}</TableCell>
                  <TableCell>{project.projectCode}</TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{formatDate(project.createDate)}</TableCell>
                  <TableCell>
                    <Select
                      value={project.projectType?.id?.toString() || ""}
                      onValueChange={(projectTypeId) => handleProjectTypeChange(project.id, projectTypeId)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projectTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {project.assignments &&
                      project.assignments.map((assignment) => (
                        <Badge key={assignment.id} variant="secondary" className="mr-1">
                          {assignment.user.username} ({assignment.role})
                        </Badge>
                      ))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openAssignModal(project.id)}>
                      Assign
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openModelEntryModal(project.id)}>
                      <HardDrive className="h-4 w-4 mr-2" />
                      Model Entry
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Users Modal */}
      {selectedProjectId && (
        <AssignUsersModal
          projectId={selectedProjectId}
          isOpen={isAssignModalOpen}
          onClose={closeAssignModal}
          onSuccess={fetchData}
        />
      )}
      <AddProjectModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={fetchData} />
      <ModelEntryModal
        projectId={selectedProjectId || 0}
        isOpen={isModelEntryModalOpen}
        onClose={closeModelEntryModal}
        onSuccess={fetchData}
      />
    </div>
  )
}

