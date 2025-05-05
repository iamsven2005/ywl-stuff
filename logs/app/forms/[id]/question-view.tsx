"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { cn } from "@/lib/utils"

type QuestionViewProps = {
  question: any
  value: any
  file: File | undefined
  onChange: (value: any) => void
  onFileChange: (file: File | null) => void
}

export function QuestionView({ question, value, file, onChange, onFileChange }: QuestionViewProps) {
  const [fileName, setFileName] = useState<string>("")

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile) {
      setFileName(selectedFile.name)
      onFileChange(selectedFile)
    } else {
      setFileName("")
      onFileChange(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-1">
        <Label className="text-base font-medium">{question.text}</Label>
        {question.required && <span className="text-destructive">*</span>}
      </div>

      {question.type === "TEXT" && (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
          className="max-w-md"
        />
      )}

      {question.type === "TEXTAREA" && (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
          className="min-h-[100px]"
        />
      )}

      {question.type === "RADIO" && (
        <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
          {question.options.map((option: any) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
              <Label htmlFor={`option-${option.id}`} className="font-normal">
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.type === "CHECKBOX" && (
        <div className="space-y-2">
          {question.options.map((option: any) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`option-${option.id}`}
                checked={(value || []).includes(option.id)}
                onCheckedChange={(checked) => {
                  const currentValue = value || []
                  if (checked) {
                    onChange([...currentValue, option.id])
                  } else {
                    onChange(currentValue.filter((id: number) => id !== option.id))
                  }
                }}
              />
              <Label htmlFor={`option-${option.id}`} className="font-normal">
                {option.text}
              </Label>
            </div>
          ))}
        </div>
      )}

      {question.type === "DROPDOWN" && (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option: any) => (
              <SelectItem key={option.id} value={option.id.toString()}>
                {option.text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.type === "FILE" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input type="file" id={`file-${question.id}`} onChange={handleFileInputChange} className="hidden" />
            <Label
              htmlFor={`file-${question.id}`}
              className={cn(
                "cursor-pointer inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              Choose File
            </Label>
            <span className="text-sm text-muted-foreground">{fileName || "No file chosen"}</span>
          </div>
        </div>
      )}
    </div>
  )
}
