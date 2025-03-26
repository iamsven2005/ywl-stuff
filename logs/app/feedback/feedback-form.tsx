"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getManagers, submitFeedback } from "@/app/actions/feedback-actions"
import { useEffect } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface FeedbackFormProps {
  onSuccess?: () => void
}

export default function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadManagers() {
      try {
        const result = await getManagers()
        console.log("Managers result:", result) // Debug log

        if (result.success) {
          setManagers(result.managers ?? [])
          console.log("Managers loaded:", result.managers) // Debug log
        } else {
          toast.error(result.error || "Failed to load managers")
        }
      } catch (error) {
        console.error("Error loading managers:", error)
        toast.error("Failed to load managers")
      } finally {
        setLoading(false)
      }
    }

    loadManagers()
  }, [])

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)

    try {
      const result = await submitFeedback(formData)

      if (result.success) {
        toast.success("Your feedback has been submitted successfully.")
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error(result.error || "Failed to submit feedback")
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading managers...</p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-base font-medium">
          Feedback Subject:
        </Label>
        <Input id="subject" name="subject" placeholder="Enter subject" required className="w-full" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-base font-medium">
          Feedback Message:
        </Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Enter your feedback message"
          required
          className="min-h-[150px] w-full"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Select one or multiple recipients:</Label>

        {managers.length === 0 ? (
          <div className="bg-muted p-4 rounded-md">
            <p className="text-muted-foreground">No managers found. Please contact your administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border rounded-md p-4">
            {managers.map((manager) => (
              <div key={manager.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                <Checkbox id={`manager-${manager.id}`} name="recipients" value={manager.id} />
                <Label htmlFor={`manager-${manager.id}`} className="cursor-pointer">
                  {manager.name || "Unnamed Manager"}
                </Label>
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {managers.length > 0
            ? `${managers.length} manager${managers.length > 1 ? "s" : ""} available`
            : "No managers available to receive feedback"}
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button type="reset" variant="outline">
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting || managers.length === 0}>
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </form>
  )
}

