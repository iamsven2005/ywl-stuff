"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, X } from "lucide-react"
import { createPoll } from "../actions/poll-actions"
import { toast } from "sonner"

interface PollCreatorProps {
  groupId: number
  senderId: number
  onClose: () => void
  onSuccess: (pollId: number) => void
}

export function PollCreator({ groupId, senderId, onClose, onSuccess }: PollCreatorProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [multiSelect, setMultiSelect] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""])
    } else {
      toast.error("Maximum 10 options allowed")
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options]
      newOptions.splice(index, 1)
      setOptions(newOptions)
    } else {
      toast.error("Minimum 2 options required")
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async () => {
    // Validate inputs
    if (!question.trim()) {
      toast.error("Please enter a question")
      return
    }

    const validOptions = options.filter((opt) => opt.trim() !== "")
    if (validOptions.length < 2) {
      toast.error("Please enter at least 2 options")
      return
    }

    try {
      setIsSubmitting(true)
      const result = await createPoll(groupId, question, validOptions, multiSelect, senderId)

      if (result.success) {
        toast.success("Poll created successfully")
        onSuccess(result.pollId)
        onClose()
      } else {
        toast.error(result.error || "Failed to create poll")
      }
    } catch (error) {
      toast.error("An error occurred while creating the poll")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Create a Poll</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's your favorite programming language?"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                maxLength={100}
              />
              <Button variant="ghost" size="icon" onClick={() => removeOption(index)} disabled={options.length <= 2}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addOption} disabled={options.length >= 10} className="mt-2">
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="multi-select" checked={multiSelect} onCheckedChange={setMultiSelect} />
        <Label htmlFor="multi-select">Allow multiple selections</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Poll"}
        </Button>
      </div>
    </div>
  )
}
