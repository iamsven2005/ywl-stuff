"use client"

import { useState, useEffect } from "react"
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
import { getAlertEvents, resolveAlertEvent } from "../actions/alert-actions"
import { Checkbox } from "@/components/ui/checkbox"

export function AlertEventsTable({
  initialAlertEvents,
  showResolved = false,
}: {
  initialAlertEvents?: any[]
  showResolved?: boolean
}) {
  const router = useRouter()
  const [alertEvents, setAlertEvents] = useState<any[]>(initialAlertEvents || [])
  const [isLoading, setIsLoading] = useState(!initialAlertEvents)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [eventToResolve, setEventToResolve] = useState<any>(null)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [isResolving, setIsResolving] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<number[]>([])
  const [multiResolveDialogOpen, setMultiResolveDialogOpen] = useState(false)

  // Fetch alert events if not provided as props
  useEffect(() => {
    if (!initialAlertEvents) {
      const fetchAlertEvents = async () => {
        try {
          setIsLoading(true)
          const { alertEvents: events } = await getAlertEvents({
            resolved: showResolved,
            page: 1,
            pageSize: 50,
          })
          setAlertEvents(events)
        } catch (error) {
          console.error("Error fetching alert events:", error)
          toast.error("Failed to load alert events")
        } finally {
          setIsLoading(false)
        }
      }

      fetchAlertEvents()
    }
  }, [initialAlertEvents, showResolved])

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

  // Handle select all events
  const handleSelectAll = () => {
    if (selectedEvents.length === filteredEvents.filter((event) => !event.resolved).length) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(filteredEvents.filter((event) => !event.resolved).map((event) => event.id))
    }
  }

  // Handle multi-resolve
  const handleMultiResolve = async () => {
    if (selectedEvents.length === 0) return

    setIsResolving(true)
    try {
      // Resolve each selected event
      const results = await Promise.all(selectedEvents.map((eventId) => resolveAlertEvent(eventId, resolutionNotes)))

      if (results.every((result) => result.success)) {
        // Update the local state
        setAlertEvents(
          alertEvents.map((event) =>
            selectedEvents.includes(event.id) ? { ...event, resolved: true, resolvedAt: new Date() } : event,
          ),
        )
        toast.success(`${selectedEvents.length} alert events resolved`)
        setMultiResolveDialogOpen(false)
        setResolutionNotes("")
        setSelectedEvents([])
      }
    } catch (error) {
      toast.error("Failed to resolve alert events")
    } finally {
      setIsResolving(false)
    }
  }

  // Filter events based on showResolved prop
  const filteredEvents = showResolved ? alertEvents : alertEvents.filter((event) => !event.resolved)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  selectedEvents.length > 0 &&
                  selectedEvents.length === filteredEvents.filter((event) => !event.resolved).length
                }
                onCheckedChange={handleSelectAll}
                disabled={filteredEvents.filter((event) => !event.resolved).length === 0}
              />
            </TableHead>
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
              <TableCell colSpan={7} className="h-24 text-center">
                No alert events found.
              </TableCell>
            </TableRow>
          ) : (
            filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEvents([...selectedEvents, event.id])
                      } else {
                        setSelectedEvents(selectedEvents.filter((id) => id !== event.id))
                      }
                    }}
                    disabled={event.resolved}
                  />
                </TableCell>
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
      {selectedEvents.length > 0 && (
        <div className="p-4 border-t flex justify-between items-center">
          <div>
            <span className="text-sm text-muted-foreground">
              {selectedEvents.length} {selectedEvents.length === 1 ? "alert" : "alerts"} selected
            </span>
          </div>
          <Button onClick={() => setMultiResolveDialogOpen(true)} size="sm" className="gap-1">
            <Check className="h-4 w-4" />
            Resolve Selected
          </Button>
        </div>
      )}

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
      <Dialog open={multiResolveDialogOpen} onOpenChange={setMultiResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Multiple Alerts</DialogTitle>
            <DialogDescription>
              You are about to resolve {selectedEvents.length} {selectedEvents.length === 1 ? "alert" : "alerts"}. Add
              optional notes about how these alerts were resolved.
            </DialogDescription>
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
            <Button variant="outline" onClick={() => setMultiResolveDialogOpen(false)} disabled={isResolving}>
              Cancel
            </Button>
            <Button onClick={handleMultiResolve} disabled={isResolving}>
              {isResolving
                ? "Resolving..."
                : `Resolve ${selectedEvents.length} ${selectedEvents.length === 1 ? "Alert" : "Alerts"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
