"use client"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect } from "react"

interface EmailTemplate {
  id: number
  name: string
  subject: string
}

interface EmailTemplateSelectorProps {
  selectedTemplateId: number | null
  onChange: (templateId: number | null) => void
  className?: string
  placeholder?: string
}

export function EmailTemplateSelector({
  selectedTemplateId,
  onChange,
  className,
  placeholder = "Select email template...",
}: EmailTemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/email-templates")
        const data = await response.json()
        setTemplates(data)
      } catch (error) {
        console.error("Failed to fetch email templates:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={loading}
        >
          {loading ? "Loading templates..." : selectedTemplate ? selectedTemplate.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search templates..." />
          <CommandList>
            <CommandEmpty>No email template found.</CommandEmpty>
            <CommandGroup>
              {templates.map((template) => (
                <CommandItem
                  key={template.id}
                  value={template.name}
                  onSelect={() => {
                    onChange(template.id === selectedTemplateId ? null : template.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", selectedTemplateId === template.id ? "opacity-100" : "opacity-0")}
                  />
                  <div className="flex flex-col">
                    <span>{template.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{template.subject}</span>
                  </div>
                </CommandItem>
              ))}
              <CommandItem
                value="clear"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
                className="text-muted-foreground"
              >
                <Check className={cn("mr-2 h-4 w-4", selectedTemplateId === null ? "opacity-100" : "opacity-0")} />
                No template (clear selection)
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

