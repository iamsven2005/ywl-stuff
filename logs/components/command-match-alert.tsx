"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { getUnaddressedCommandMatchCount } from "@/app/actions/command-monitoring-actions"
import { toast } from "sonner"

// Add this interface to define the shape of a match
interface CommandMatchProps {
  id?: number
  command: string
  rule: {
    id: number
    name: string
  }
  emailTemplateId?: number | null
  emailTemplateName?: string | null
}

export function CommandMatchAlert({ matches = [] }: { matches: CommandMatchProps[] }) {
  const router = useRouter()
  const [unaddressedCount, setUnaddressedCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUnaddressedCount = async () => {
      try {
        const count = await getUnaddressedCommandMatchCount()
        setUnaddressedCount(count)
      } catch (error) {
        console.error("Error fetching unaddressed command match count:", error)
      }
    }

    fetchUnaddressedCount()

    // Set up polling to check for new matches every minute
    const interval = setInterval(fetchUnaddressedCount, 60000)
    return () => clearInterval(interval)
  }, [])

  // Update count when matches prop changes
  useEffect(() => {
    if (matches.length > 0) {
      setUnaddressedCount((prev) => prev + matches.length)

      // Show toast notification for new matches
      matches.forEach((match) => {
        toast.error(`Command Match Detected: "${match.command}" in rule "${match.rule.name}"`, {
          description: "Check command matches for details",
          duration: 5000,
        })
      })
    }
  }, [matches])

  const handleViewAll = () => {
    router.push("/command")
  }


  if (unaddressedCount === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge
            className="absolute -top-2 -right-2 px-1 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center"
            variant="destructive"
          >
            {unaddressedCount}
          </Badge>
          <span className="sr-only">Command matches</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Command Matches</span>
          <Badge variant="outline">{unaddressedCount} unaddressed</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleViewAll}>View all command matches</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

