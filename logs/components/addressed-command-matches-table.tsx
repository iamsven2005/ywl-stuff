"use client"

import { useState } from "react"
import { Eye, Trash2, CheckSquare, Square, Undo2 } from "lucide-react"
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
import { deleteCommandMatch, unmarkCommandMatchAsAddressed } from "@/app/actions/command-monitoring-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

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
  const [isUnmarkDialogOpen, setIsUnmarkDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMatches, setSelectedMatches] = useState<number[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

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

  const handleUnmark = async () => {
    if (!selectedMatch) return

    try {
      setIsSubmitting(true)
      await unmarkCommandMatchAsAddressed(selectedMatch.id)
      toast.success("The command match has been unmarked and moved to unaddressed.")
      setIsUnmarkDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error unmarking command match:", error)
      toast.error("Failed to unmark command match.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMatch = (id: number) => {
    setSelectedMatches((prev) => (prev.includes(id) ? prev.filter((matchId) => matchId !== id) : [...prev, id]))
  }

  const selectAll = () => {
    setSelectedMatches(matches.map((match) => match.id))
  }

  const deselectAll = () => {
    setSelectedMatches([])
  }

  const handleBulkDelete = async () => {
    try {
      setIsSubmitting(true)

      // Delete each selected match one by one
      for (const matchId of selectedMatches) {
        await deleteCommandMatch(matchId)
      }

      toast.success(`${selectedMatches.length} command matches have been deleted.`)
      setIsBulkDeleteDialogOpen(false)
      setSelectedMatches([])
      router.refresh()
    } catch (error) {
      console.error("Error deleting command matches:", error)
      toast.error("Failed to delete command matches.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {selectedMatches.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected ({selectedMatches.length})
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Rule</TableHead>
              <TableHead>Command</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Detected</TableHead>
              <TableHead>Addressed By</TableHead>
              <TableHead>Addressed At</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => {
              // Use either command or commandText, whichever is available
              const commandDisplay = match.command || match.commandText || "Unknown command"

              return (
                <TableRow key={match.id}>
                  <TableCell>
                    <button
                      onClick={() => toggleMatch(match.id)}
                      className="p-1 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      {selectedMatches.includes(match.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {match.rule.name}
                    {match.rule.group && (
                      <span className="text-xs text-muted-foreground block">Group: {match.rule.group.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={commandDisplay}>
                    {commandDisplay}
                  </TableCell>
                  <TableCell>
                    {match.notes ? (
                      <Badge variant="outline" className="cursor-help" title={match.notes}>
                        Has notes
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(match.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{match.addressedByUser ? match.addressedByUser.username : "Unknown"}</TableCell>
                  <TableCell>{match.addressedAt ? new Date(match.addressedAt).toLocaleString() : "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(match)} title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-amber-600"
                        onClick={() => {
                          setSelectedMatch(match)
                          setIsUnmarkDialogOpen(true)
                        }}
                        title="Unmark as Addressed"
                      >
                        <Undo2 className="h-4 w-4" />
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

      {/* Unmark Dialog */}
      <Dialog open={isUnmarkDialogOpen} onOpenChange={setIsUnmarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unmark Command Match</DialogTitle>
            <DialogDescription>
              Are you sure you want to unmark this command match as addressed? It will be moved back to the unaddressed
              tab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnmarkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnmark} disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Unmark"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Command Matches</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedMatches.length} command matches? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : `Delete ${selectedMatches.length} Matches`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

