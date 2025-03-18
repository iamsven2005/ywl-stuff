"use client"

import { useState } from "react"
import { Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteCommandMatch } from "@/app/actions/command-monitoring-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AddressedCommandMatchesTableProps {
  matches: Array<{
    id: number
    ruleId: number
    command: string
    commandText?: string
    logEntry: string
    addressed: boolean
    addressedAt: Date | null
    timestamp: Date
    notes?: string | null
    rule: {
      name: string
      group?: {
        name: string
      } | null
    }
    addressedByUser?: {
      id: number
      username: string
    } | null
  }>
}

export function AddressedCommandMatchesTable({ matches }: AddressedCommandMatchesTableProps) {
  const router = useRouter()
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleView = (match: any) => {
    setSelectedMatch(match)
    setIsViewDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedMatch) return

    try {
      setIsSubmitting(true)
      await deleteCommandMatch(selectedMatch.id)
      toast.success("The command match has been deleted.")
      setIsDeleteDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting command match:", error)
      toast.error("Failed to delete command match.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Command</TableHead>
              <TableHead>Detected</TableHead>
              <TableHead>Addressed By</TableHead>
              <TableHead>Addressed At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => {
              // Use either command or commandText, whichever is available
              const commandDisplay = match.command || match.commandText || "Unknown command"

              return (
                <TableRow key={match.id}>
                  <TableCell className="font-medium">
                    {match.rule.name}
                    {match.rule.group && (
                      <span className="text-xs text-muted-foreground block">Group: {match.rule.group.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={commandDisplay}>
                    {commandDisplay}
                  </TableCell>
                  <TableCell>{new Date(match.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{match.addressedByUser ? match.addressedByUser.username : "Unknown"}</TableCell>
                  <TableCell>{match.addressedAt ? new Date(match.addressedAt).toLocaleString() : "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(match)} title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => {
                          setSelectedMatch(match)
                          setIsDeleteDialogOpen(true)
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      {selectedMatch && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Command Match Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Rule</h3>
                <p>{selectedMatch.rule.name}</p>
                {selectedMatch.rule.group && (
                  <p className="text-sm text-muted-foreground">Group: {selectedMatch.rule.group.name}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium">Command</h3>
                <p className="font-mono bg-muted p-2 rounded-md">
                  {selectedMatch.command || selectedMatch.commandText}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Log Entry</h3>
                <div className="font-mono text-sm bg-muted p-2 rounded-md max-h-40 overflow-y-auto">
                  {selectedMatch.logEntry}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Detected</h3>
                  <p>{new Date(selectedMatch.timestamp).toLocaleString()}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Addressed</h3>
                  <p>{selectedMatch.addressedAt ? new Date(selectedMatch.addressedAt).toLocaleString() : "N/A"}</p>
                  {selectedMatch.addressedByUser && (
                    <p className="text-sm text-muted-foreground">By: {selectedMatch.addressedByUser.username}</p>
                  )}
                </div>
              </div>

              {selectedMatch.notes && (
                <div>
                  <h3 className="text-sm font-medium">Notes</h3>
                  <div className="bg-muted p-2 rounded-md">{selectedMatch.notes}</div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Command Match</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this command match? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

