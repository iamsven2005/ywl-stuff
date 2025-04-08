"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUploader } from "./file-uploader"
import { parseHtmlContent } from "./utils"
import { bulkInsertJobTitles, deleteJobTitles, getJobTitles } from "../actions/job-title"
import { Trash2 } from 'lucide-react'
import { JobTitle } from "@prisma/client"

export default function JobTitlesPage() {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filteredTitles, setFilteredTitles] = useState<JobTitle[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSeniority, setSelectedSeniority] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    const filtered = jobTitles.filter((job) => {
      const matchesSearch = job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSeniority = selectedSeniority ? job.seniorityLevel === selectedSeniority : true
      return matchesSearch && matchesSeniority
    })
  
    setFilteredTitles(filtered)
  }, [searchTerm, selectedSeniority, jobTitles])
  
  useEffect(() => {
    const fetchTitles = async () => {
      setIsLoading(true)
      try {
        const res = await getJobTitles()
        setJobTitles(res)
        setFilteredTitles(res)
      } catch (err) {
        console.error("Error fetching job titles:", err)
        setError("Failed to fetch job titles")
      } finally {
        setIsLoading(false)
      }
    }
  
    fetchTitles()
  }, [])
  
  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setError(null)
  
    try {
      const content = await file.text()
      const parsedData = parseHtmlContent(content)
      await bulkInsertJobTitles(parsedData)
      
      // Refresh the job titles list
      const res = await getJobTitles()
      setJobTitles(res)
      setFilteredTitles(res)
    } catch (err) {
      console.error("Error parsing file:", err)
      setError("Failed to parse the HTML file. Please ensure it has the correct format.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTitles.map(job => job.id))
    } else {
      setSelectedIds([])
    }
  }
  
  const handleSelectJob = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(jobId => jobId !== id))
    }
  }
  
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} job titles?`)) {
      return
    }
    
    setIsDeleting(true)
    
    try {
      await deleteJobTitles(selectedIds)
      
      // Refresh the job titles list
      const res = await fetch("/api/job-titles")
      const data = await res.json()
      setJobTitles(data)
      setFilteredTitles(data)
      setSelectedIds([])
    } catch (err) {
      console.error("Error deleting job titles:", err)
      setError("Failed to delete job titles")
    } finally {
      setIsDeleting(false)
    }
  }

  const exportToCSV = () => {
    if (jobTitles.length === 0) return

    const headers = ["S/N", "Job Title", "Abbreviation", "Grade", "Seniority Level", "Selectable in Staff CV"]
    const csvContent = [
      headers.join(","),
      ...filteredTitles.map((job) =>
        [
          job.sn,
          `"${job.jobTitle}"`,
          job.abbreviation,
          `"${job.grade}"`,
          job.seniorityLevel,
          job.selectableInStaffCV,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "job_titles.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Job Titles Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Search job title..."
              className="border p-2 rounded w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              value={selectedSeniority}
              onChange={(e) => setSelectedSeniority(e.target.value)}
              className="border p-2 rounded w-full sm:w-64"
            >
              <option value="">All Seniority Levels</option>
              {[...new Set(jobTitles.map((j) => j.seniorityLevel))].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {filteredTitles.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium">
                    Job Titles ({filteredTitles.length} of {jobTitles.length})
                  </h3>
                  {selectedIds.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedIds.length})
                    </Button>
                  )}
                </div>
                <Button onClick={exportToCSV}>Export to CSV</Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox 
                            checked={filteredTitles.length > 0 && selectedIds.length === filteredTitles.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>S/N</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Abbreviation</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Seniority Level</TableHead>
                        <TableHead>Selectable in Staff CV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTitles.map((job) => (
                        <TableRow key={job.sn}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedIds.includes(job.id)}
                              onCheckedChange={(checked) => handleSelectJob(job.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell>{job.sn}</TableCell>
                          <TableCell>{job.jobTitle}</TableCell>
                          <TableCell>{job.abbreviation}</TableCell>
                          <TableCell>{job.grade}</TableCell>
                          <TableCell>{job.seniorityLevel}</TableCell>
                          <TableCell>{job.selectableInStaffCV ? "true" : "false"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          {!isLoading && filteredTitles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {jobTitles.length > 0 
                ? "No job titles match your search criteria" 
                : "No job titles found. Upload an HTML file to import job titles."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
