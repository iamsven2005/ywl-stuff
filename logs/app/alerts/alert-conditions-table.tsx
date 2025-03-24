"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Bell, Edit, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { deleteAlertCondition, toggleAlertConditionStatus } from "../actions/alert-actions"

export function AlertConditionsTable({ initialAlertConditions }: { initialAlertConditions: any[] }) {
  const router = useRouter()
  const [alertConditions, setAlertConditions] = useState(initialAlertConditions)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conditionToDelete, setConditionToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handle toggling the active status
  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      const result = await toggleAlertConditionStatus(id, !currentActive)
      if (result.success) {
        // Update the local state
        setAlertConditions(
          alertConditions.map((condition) =>
            condition.id === id ? { ...condition, active: !currentActive } : condition,
          ),
        )
        toast.success(`Alert condition ${!currentActive ? "activated" : "deactivated"}`)
      }
    } catch (error) {
      toast.error("Failed to update alert condition status")
    }
  }

  // Handle deleting an alert condition
  const handleDelete = async () => {
    if (!conditionToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteAlertCondition(conditionToDelete.id)
      if (result.success) {
        // Remove from local state
        setAlertConditions(alertConditions.filter((condition) => condition.id !== conditionToDelete.id))
        toast.success("Alert condition deleted")
        setDeleteDialogOpen(false)
      }
    } catch (error) {
      toast.error("Failed to delete alert condition")
    } finally {
      setIsDeleting(false)
    }
  }

  // Format the comparator for display
  const formatComparator = (comparator: string) => {
    switch (comparator) {
      case ">":
        return "greater than"
      case ">=":
        return "greater than or equal to"
      case "<":
        return "less than"
      case "<=":
        return "less than or equal to"
      case "==":
        return "equal to"
      case "!=":
        return "not equal to"
      case "contains":
        return "contains"
      case "not_contains":
        return "does not contain"
      case "equals":
        return "equals"
      default:
        return comparator
    }
  }

  // Format the source table for display
  const formatSourceTable = (sourceTable: string) => {
    switch (sourceTable) {
      case "system_metrics":
        return "System Metrics"
      case "auth":
        return "Auth Logs"
      case "logs":
        return "System Logs"
      default:
        return sourceTable
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Name</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Time Window</TableHead>
            <TableHead>Repeat Interval</TableHead>
            <TableHead>Email Template</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alertConditions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No alert conditions found.
              </TableCell>
            </TableRow>
          ) : (
            alertConditions.map((condition) => (
              <TableRow key={condition.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <Link href={`/alerts/${condition.id}`} className="hover:underline">
                      {condition.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{formatSourceTable(condition.sourceTable)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      {condition.fieldName} {condition.comparator} {condition.thresholdValue}
                    </code>
                    {condition.countThreshold && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Trigger after {condition.countThreshold} occurrences
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{condition.timeWindowMin ? `${condition.timeWindowMin} minutes` : "Not set"}</TableCell>
                <TableCell>
                  {condition.repeatIntervalMin ? `${condition.repeatIntervalMin} minutes` : "Not set"}
                </TableCell>
                <TableCell>
                  {condition.emailTemplate ? (
                    <Link
                      href={`/email-templates/${condition.emailTemplate.id}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      {condition.emailTemplate.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={condition.active}
                      onCheckedChange={() => handleToggleActive(condition.id, condition.active)}
                    />
                    <span className={condition.active ? "text-green-600" : "text-muted-foreground"}>
                      {condition.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/alerts/${condition.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/alerts/${condition.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setConditionToDelete(condition)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this alert condition?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the alert condition and all associated alert events. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

