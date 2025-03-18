"use client"

import { useState } from "react"
import { Bell, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { markCommandMatchAsAddressed, deleteCommandMatch } from "@/app/actions/command-monitoring-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CommandMatchNotificationProps {
  match: {
    id: number
    ruleId: number
    commandId?: number
    logId?: number
    logType?: string
    command: string
    commandText?: string
    logEntry: string
    addressed: boolean
    addressedAt: Date | null
    timestamp: Date
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
  }
}

export function CommandMatchNotification({ match }: CommandMatchNotificationProps) {
  const router = useRouter()
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  // Use either command or commandText, whichever is available
  const commandDisplay = match.command || match.commandText || "Unknown command"

  const handleAddress = async () => {
    try {
      setIsSubmitting(true)
      await markCommandMatchAsAddressed(match.id, notes)
      toast.success("The command match has been marked as addressed.")
      setIsAddressDialogOpen(false)
      setIsHidden(true)
      router.refresh()
    } catch (error) {
      console.error("Error addressing command match:", error)
      toast.error("Failed to mark command match as addressed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsSubmitting(true)
      await deleteCommandMatch(match.id)
      toast.success("The command match has been deleted.")
      setIsDeleteDialogOpen(false)
      setIsHidden(true)
      router.refresh()
    } catch (error) {
      console.error("Error deleting command match:", error)
      toast.error("Failed to delete command match.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isHidden) {
    return null
  }

  return (
    <>
      <Card className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Bell className="mr-2 h-5 w-5 text-amber-500" />
            Command Match: {match.rule.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Command:</span> {commandDisplay}
            </div>
            <div>
              <span className="font-semibold">Log Entry:</span>
              <div className="mt-1 p-2 bg-muted rounded-md max-h-24 overflow-y-auto">{match.logEntry}</div>
            </div>
            <div>
              <span className="font-semibold">Detected:</span> {new Date(match.timestamp).toLocaleString()}
            </div>
            {match.addressedAt && (
              <div>
                <span className="font-semibold">Addressed:</span> {new Date(match.addressedAt).toLocaleString()}
                {match.addressedByUser && (
                  <span className="ml-2 text-muted-foreground">by {match.addressedByUser.username}</span>
                )}
              </div>
            )}
            {match.rule.group && (
              <div>
                <span className="font-semibold">Group:</span> {match.rule.group.name}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <div className="flex space-x-2">
            {!match.addressed && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600"
                onClick={() => setIsAddressDialogOpen(true)}
              >
                <Check className="mr-1 h-4 w-4" /> Mark Addressed
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-red-600" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Command Match as Addressed</DialogTitle>
            <DialogDescription>Add optional notes about how this command match was addressed.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddress} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Mark as Addressed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

