"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export type OptionType = {
  label: string
  value: string
}

interface MultiComboboxProps {
  options: OptionType[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

export function MultiCombobox({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  emptyText = "No items found.",
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [dropdownSearch, setDropdownSearch] = React.useState("")
  const [tagSearch, setTagSearch] = React.useState("")

  const safeOptions = Array.isArray(options) ? options : []
  const safeSelected = Array.isArray(selected) ? selected : []

  const filteredOptions = safeOptions.filter(
    (option) =>
      !safeSelected.includes(option.value) &&
      option.label.toLowerCase().includes(dropdownSearch.toLowerCase())
  )

  const filteredSelected = safeSelected.filter((value) => {
    const label = safeOptions.find(opt => opt.value === value)?.label || value
    return label.toLowerCase().includes(tagSearch.toLowerCase())
  })

  const handleSelect = (value: string) => {
    onChange([...safeSelected, value])
  }

  const handleRemove = (valueToRemove: string) => {
    onChange(safeSelected.filter(value => value !== valueToRemove))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 relative text-left",
            safeSelected.length > 0 ? "h-auto" : "h-10",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <div className="w-full max-h-[120px] overflow-y-auto flex flex-wrap gap-1 items-center pr-6">
            {safeSelected.length > 0 ? (
              <>
                {/* Inline search for selected tags */}
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search tags..."
                  className="text-sm text-muted-foreground border rounded px-2 py-0.5 mr-1 mb-1 h-6"
                  onClick={(e) => e.stopPropagation()}
                />
                {filteredSelected.map((value) => (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="mr-1 mb-1 flex items-center gap-1"
                  >
                    {safeOptions.find((opt) => opt.value === value)?.label || value}
                    <button
                      className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(value)
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 absolute right-2 top-1/2 -translate-y-1/2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={dropdownSearch}
            onValueChange={setDropdownSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      safeSelected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
