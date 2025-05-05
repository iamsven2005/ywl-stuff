"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Grip, PlusCircle, Trash, X } from "lucide-react"
import { useState } from "react"
import { QuestionType } from "@/prisma/generated/main"

type QuestionEditorProps = {
  question: {
    id: string | number
    text: string
    type: QuestionType
    required: boolean
    order: number
    options: Array<{
      id: string | number
      text: string
      value: string
    }>
  }
  onChange: (question: any) => void
  onRemove: () => void
  isOnly: boolean
}

export function QuestionEditor({ question, onChange, onRemove, isOnly }: QuestionEditorProps) {
  const [showOptionInput, setShowOptionInput] = useState(false)
  const [newOptionText, setNewOptionText] = useState("")

  const handleTypeChange = (type: QuestionType) => {
    onChange({
      ...question,
      type,
      // Initialize options array if switching to a type that needs options
      options:
        type === "RADIO" || type === "CHECKBOX" || type === "DROPDOWN"
          ? question.options.length
            ? question.options
            : []
          : [],
    })
  }

  const handleAddOption = () => {
    if (!newOptionText.trim()) return

    const newOption = {
      id: `temp-${Date.now()}`,
      text: newOptionText,
      value: newOptionText.toLowerCase().replace(/\s+/g, "-"),
    }

    onChange({
      ...question,
      options: [...question.options, newOption],
    })

    setNewOptionText("")
    setShowOptionInput(false)
  }

  const handleRemoveOption = (optionId: string | number) => {
    onChange({
      ...question,
      options: question.options.filter((o) => o.id !== optionId),
    })
  }

  const questionTypes = [
    { value: "TEXT", label: "Short Answer" },
    { value: "TEXTAREA", label: "Paragraph" },
    { value: "RADIO", label: "Multiple Choice" },
    { value: "CHECKBOX", label: "Checkboxes" },
    { value: "DROPDOWN", label: "Dropdown" },
    { value: "FILE", label: "File Upload" },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 bg-muted/50">
        <div className="flex items-center gap-2">
          <Grip className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Question</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={isOnly}
          title={isOnly ? "Cannot remove the only question" : "Remove question"}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label htmlFor={`question-${question.id}`}>Question Text</Label>
          <Input
            id={`question-${question.id}`}
            value={question.text}
            onChange={(e) => onChange({ ...question, text: e.target.value })}
            placeholder="Enter your question"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor={`type-${question.id}`}>Question Type</Label>
          <Select value={question.type} onValueChange={(value) => handleTypeChange(value as QuestionType)}>
            <SelectTrigger id={`type-${question.id}`} className="mt-1">
              <SelectValue placeholder="Select question type" />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(question.type === "RADIO" || question.type === "CHECKBOX" || question.type === "DROPDOWN") && (
          <div className="space-y-3">
            <Label>Options</Label>
            <div className="space-y-2">
              {question.options.map((option) => (
                <div key={option.id.toString()} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const updatedOptions = question.options.map((o) =>
                        o.id === option.id
                          ? {
                              ...o,
                              text: e.target.value,
                              value: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                            }
                          : o,
                      )
                      onChange({ ...question, options: updatedOptions })
                    }}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(option.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {showOptionInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Enter option text"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddOption()
                      }
                    }}
                  />
                  <Button variant="ghost" size="icon" onClick={() => setShowOptionInput(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleAddOption}>Add</Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowOptionInput(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id={`required-${question.id}`}
            checked={question.required}
            onCheckedChange={(checked) => onChange({ ...question, required: checked })}
          />
          <Label htmlFor={`required-${question.id}`}>Required question</Label>
        </div>
      </CardContent>
    </Card>
  )
}
