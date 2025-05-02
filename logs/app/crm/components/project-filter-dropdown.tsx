"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"

interface ProjectFilterDropdownProps {
  currentStatus: string | undefined
}

export function ProjectFilterDropdown({ currentStatus }: ProjectFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Define project statuses for filter links
  const projectStatuses = [
    { value: "all", label: "All Statuses" },
    { value: "PLANNING", label: "Planning" },
    { value: "BIDDING", label: "Bidding" },
    { value: "DESIGN", label: "Design" },
    { value: "PERMITTING", label: "Permitting" },
    { value: "CONSTRUCTION", label: "Construction" },
    { value: "INSPECTION", label: "Inspection" },
    { value: "COMPLETED", label: "Completed" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "CANCELLED", label: "Cancelled" },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="outline" size="sm" className="w-[180px] justify-between" onClick={() => setIsOpen(!isOpen)}>
        <span>{currentStatus ? projectStatuses.find((s) => s.value === currentStatus)?.label : "All Statuses"}</span>
        <Filter className="h-4 w-4 ml-2" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[200px] z-10 bg-background rounded-md shadow-lg border">
          <div className="py-1">
            {projectStatuses.map((statusOption) => (
              <Link
                key={statusOption.value}
                href={statusOption.value === "all" ? "/crm/projects" : `/crm/projects?status=${statusOption.value}`}
                className={`block px-4 py-2 text-sm hover:bg-muted ${
                  (currentStatus === statusOption.value) || (!currentStatus && statusOption.value === "all")
                    ? "bg-muted font-medium"
                    : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                {statusOption.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
