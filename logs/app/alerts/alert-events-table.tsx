"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { AlertCircle, Bell, Check, CheckCircle, ExternalLink, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { resolveAlertEvent } from "../actions/alert-actions"

export function AlertEventsTable({
  initialAlertEvents,
  showResolved = true,
}: {
  initialAlertEvents: any[]
  showResolved?: boolean
}) {
  const router = useRouter()
  const [alertEvents, setAlertEvents] = useState(initialAlertEvents)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [eventToResolve, setEventToResolve] = useState<any>(null)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [isResolving, setIsResolving] = useState(false)

  // Handle resolving an alert event
  const handleResolve = async () => {
    if (!eventToResolve) return

    setIsResolving(true)
    try {
      const result = await resolveAlertEvent(eventToResolve.id, resolutionNotes)
      if (result.success) {
        // Update the local state
        setAlertEvents(
          alertEvents.map((event) =>
            event.id === eventToResolve.id ? { ...event, resolved: true, resolvedAt: new Date() } : event,
          ),
        )
        toast.success("Alert event resolved")
        setResolveDialogOpen(false)
        setResolutionNotes("")
      }
    } catch (error) {
      toast.error("Failed to resolve alert event")
    } finally {
      setIsResolving(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Filter events based on showResolved prop
  const filteredEvents = showResolved ? alertEvents : alertEvents.filter((event) => !event.resolved)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Alert Condition</TableHead>
            <TableHead>Triggered At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Resolved At</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No alert events found.
              </TableCell>
            </TableRow>
          ) : (
            filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <Link href={`/alerts/${event.alertCondition.id}`} className="hover:underline">
                      {event.alertCondition.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell>{formatDate(event.triggeredAt)}</TableCell>
                <TableCell>
                  {event.resolved ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {event.resolvedAt ? formatDate(event.resolvedAt) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {event.notes ? (
                    <div className="max-w-[300px] truncate" title={event.notes}>
                      {event.notes}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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
                        <Link href={`/alerts/events/${event.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {!event.resolved && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setEventToResolve(event)
                              setResolveDialogOpen(true)
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Resolve
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>Add optional notes about how this alert was resolved.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Resolution notes (optional)"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)} disabled={isResolving}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isResolving}>
              {isResolving ? "Resolving..." : "Resolve Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

