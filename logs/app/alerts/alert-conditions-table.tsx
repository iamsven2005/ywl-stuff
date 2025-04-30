"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { notFound, redirect, useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Check, Download, Edit, MoreHorizontal, Trash, Upload, X } from 'lucide-react'
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { deleteAlertCondition, getAlertConditions, toggleAlertConditionStatus } from "../actions/alert-actions"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { getCurrentUser } from "../login/actions"
import { checkUserPermission } from "../actions/permission-actions"

export function AlertConditionsTable({ initialAlertConditions }: { initialAlertConditions?: any[] }) {
  const router = useRouter()
  const [alertConditions, setAlertConditions] = useState<any[]>(initialAlertConditions || [])
  const [isLoading, setIsLoading] = useState(!initialAlertConditions)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  // Fetch alert conditions if not provided as props
  useEffect(() => {
    if (!initialAlertConditions) {
      const fetchAlertConditions = async () => {
        try {
            const currentUser = await getCurrentUser()
            if (!currentUser) {
              redirect("/login")
            }
            const perm = await checkUserPermission(currentUser.id, "/alerts")
            if (perm.hasPermission === false) {
              return notFound()
            }
          setIsLoading(true)
          const conditions = await getAlertConditions()
          setAlertConditions(conditions)
        } catch (error) {
          console.error("Error fetching alert conditions:", error)
          toast.error("Failed to load alert conditions")
        } finally {
          setIsLoading(false)
        }
      }

      fetchAlertConditions()
    }
  }, [initialAlertConditions])

  // Toggle alert condition active status
  const handleToggleStatus = async (id: number, active: boolean) => {
    try {
      await toggleAlertConditionStatus(id, !active)

      // Update local state
      setAlertConditions((prev) =>
        prev.map((condition) => (condition.id === id ? { ...condition, active: !active } : condition)),
      )

      toast.success(`Alert condition ${!active ? "activated" : "deactivated"} successfully`)
      router.refresh()
    } catch (error) {
      console.error("Error toggling alert condition status:", error)
      toast.error("Failed to update alert condition status")
    }
  }

  // Delete alert condition
  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true)
      await deleteAlertCondition(id)

      // Update local state
      setAlertConditions((prev) => prev.filter((condition) => condition.id !== id))

      toast.success("Alert condition deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error deleting alert condition:", error)
      toast.error("Failed to delete alert condition")
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  // Export all alert conditions to CSV
  const exportAllToCSV = () => {
    try {
      // Create CSV content
      const headers = [
        "name",
        "sourceTable",
        "fieldName",
        "comparator",
        "thresholdValue",
        "timeWindowMin",
        "countThreshold",
        "repeatIntervalMin",
        "active",
        "emailTemplateId",
      ].join(",")

      const rows = alertConditions.map((condition) =>
        [
          condition.name,
          condition.sourceTable,
          condition.fieldName,
          condition.comparator,
          condition.thresholdValue,
          condition.timeWindowMin,
          condition.countThreshold,
          condition.repeatIntervalMin,
          condition.active ? "Yes" : "No",
          condition.emailTemplateId,
        ].join(","),
      )

      const csv = [headers, ...rows].join("\n")

      // Create download link
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `alert_conditions_export_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Alert conditions exported successfully")
    } catch (error) {
      console.error("Error exporting alert conditions:", error)
      toast.error("Failed to export alert conditions")
    }
  }

  // Import alert conditions from CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  const processImport = async () => {
    if (!importFile) return

    try {
      const reader = new FileReader()

      reader.onload = async (e) => {
        const csv = e.target?.result as string
        const lines = csv.split("\n")
        const headers = lines[0].split(",")

        // Process each row (skip header)
        const importedConditions = []

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue

          const values = lines[i].split(",")
          const condition: Record<string, any> = {}

          headers.forEach((header, index) => {
            if (header === "active") {
              condition[header] = values[index] === "Yes"
            } else if (["timeWindowMin", "countThreshold", "repeatIntervalMin", "emailTemplateId"].includes(header)) {
              condition[header] = values[index] ? Number.parseInt(values[index], 10) : null
            } else {
              condition[header] = values[index]
            }
          })

          importedConditions.push(condition)
        }

        // TODO: Add server action to bulk import alert conditions
        // For now, we'll just show a success message
        console.log("Imported conditions:", importedConditions)

        toast.success(`Imported ${importedConditions.length} alert conditions`)
        setIsImporting(false)
        setImportFile(null)
        router.refresh()
      }

      reader.readAsText(importFile)
    } catch (error) {
      console.error("Error importing alert conditions:", error)
      toast.error("Failed to import alert conditions")
      setIsImporting(false)
      setImportFile(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Alert Conditions</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={exportAllToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsImporting(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button asChild>
            <Link href="/alerts/new">Create Alert Condition</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Time Window</TableHead>
              <TableHead>Count Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Triggered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alertConditions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No alert conditions found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              alertConditions.map((condition) => (
                <TableRow key={condition.id}>
                  <TableCell className="font-medium">
                    <Link href={`/alerts/${condition.id}`} className="hover:underline">
                      {condition.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap">
                      {condition.fieldName} {condition.comparator} {condition.thresholdValue}
                    </span>
                  </TableCell>
                  <TableCell>{condition.timeWindowMin ? `${condition.timeWindowMin} minutes` : "N/A"}</TableCell>
                  <TableCell>{condition.countThreshold || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={condition.active ? "outline" : "secondary"}>
                      {condition.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{condition.lastTriggeredAt ? formatDate(condition.lastTriggeredAt) : "Never"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/alerts/${condition.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/alerts/${condition.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(condition.id, condition.active)}>
                          {condition.active ? (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(condition.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this alert condition and all associated alert events. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
              className="bg-destructive  hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <AlertDialog open={isImporting} onOpenChange={setIsImporting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Alert Conditions</AlertDialogTitle>
            <AlertDialogDescription>
              Upload a CSV file with alert conditions to import. The file should have the same format as the exported
              CSV.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input type="file" accept=".csv" onChange={handleImportFile} />
            {importFile && <p className="mt-2 text-sm text-muted-foreground">Selected file: {importFile.name}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportFile(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={processImport} disabled={!importFile}>
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
