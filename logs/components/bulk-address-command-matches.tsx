"use client"

import { useState } from "react"
import { Check, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BulkAddressCommandMatchesProps {
  matches: Array<{
    id: number
    ruleId: number
    command: string
    commandText?: string
    logEntry: string
    timestamp: Date
    rule: {
      name: string
      group?: {
        name: string
      } | null
    }
  }>
}

export function BulkAddressCommandMatches({ matches }: BulkAddressCommandMatchesProps) {
  const router = useRouter()
  const [selectedMatches, setSelectedMatches] = useState<number[]>([])
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleMatch = (id: number) => {
    setSelectedMatches((prev) => (prev.includes(id) ? prev.filter((matchId) => matchId !== id) : [...prev, id]))
  }

  const selectAll = () => {
    setSelectedMatches(matches.map((match) => match.id))
  }

  const deselectAll = () => {
    setSelectedMatches([])
  }

  const handleBulkAddress = async () => {
    if (selectedMatches.length === 0) {
      toast.error("Please select at least one command match to address")
      return
    }

    setIsAddressDialogOpen(true)
  }

  const submitBulkAddress = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch("/api/command-matches/bulk-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchIds: selectedMatches,
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to address command matches")
      }

      toast.success(`${selectedMatches.length} command matches have been addressed`)
      setIsAddressDialogOpen(false)
      setSelectedMatches([])
      router.refresh()
    } catch (error) {
      console.error("Error addressing command matches:", error)
      toast.error("Failed to address command matches")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll} disabled={selectedMatches.length === 0}>
            Deselect All
          </Button>
        </div>
        <Button
          onClick={handleBulkAddress}
          disabled={selectedMatches.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <Check className="mr-2 h-4 w-4" />
          Address Selected ({selectedMatches.length})
        </Button>
      </div>

      {matches.map((match) => {
        // Use either command or commandText, whichever is available
        const commandDisplay = match.command || match.commandText || "Unknown command"

        return (
          <Card key={match.id} className="mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center">
                  <button
                    onClick={() => toggleMatch(match.id)}
                    className="mr-2 p-1 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {selectedMatches.includes(match.id) ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  Command Match: {match.rule.name}
                </CardTitle>
              </div>
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
                {match.rule.group && (
                  <div>
                    <span className="font-semibold">Group:</span> {match.rule.group.name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Bulk Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Address {selectedMatches.length} Command Matches</DialogTitle>
            <DialogDescription>
              Add optional notes about how these command matches were addressed. The same notes will be applied to all
              selected matches.
            </DialogDescription>
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
            <Button onClick={submitBulkAddress} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : `Address ${selectedMatches.length} Matches`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

