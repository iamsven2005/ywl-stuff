"use client"

import { useState, useEffect } from "react"
import { Bell, X } from "lucide-react"
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
  // Add hideUntil state
  const [hideUntil, setHideUntil] = useState<number | null>(null)

  // Add a function to hide command matches temporarily
  const hideTemporarily = (hours: number) => {
    const hideUntilTime = Date.now() + hours * 60 * 60 * 1000
    setHideUntil(hideUntilTime)
    localStorage.setItem("commandMatchesHideUntil", hideUntilTime.toString())
    toast.success(`Command matches hidden for ${hours} hour${hours > 1 ? "s" : ""}`)
  }

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

  // Check localStorage on component mount
  useEffect(() => {
    const storedHideUntil = localStorage.getItem("commandMatchesHideUntil")
    if (storedHideUntil) {
      const hideTime = Number.parseInt(storedHideUntil)
      if (hideTime > Date.now()) {
        setHideUntil(hideTime)
      } else {
        localStorage.removeItem("commandMatchesHideUntil")
      }
    }
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
    router.push("/command-matches")
  }

  const handleMarkAllAsAddressed = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/command-matches/mark-all-addressed", {
        method: "POST",
      })

      if (response.ok) {
        setUnaddressedCount(0)
        toast.success("All command matches marked as addressed")
      } else {
        toast.error("Failed to mark all command matches as addressed")
      }
    } catch (error) {
      console.error("Error marking all command matches as addressed:", error)
      toast.error("Failed to mark all command matches as addressed")
    } finally {
      setLoading(false)
    }
  }

  // Add this check before the return null statement
  if (unaddressedCount === 0 || (hideUntil && hideUntil > Date.now())) {
    return null
  }

  return (
    <div className="flex items-center gap-1">
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
            <DropdownMenuItem onClick={handleMarkAllAsAddressed} disabled={loading}>
              {loading ? "Processing..." : "Mark all as addressed"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Hide Temporarily</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => hideTemporarily(1)}>Hide for 1 hour</DropdownMenuItem>
            <DropdownMenuItem onClick={() => hideTemporarily(4)}>Hide for 4 hours</DropdownMenuItem>
            <DropdownMenuItem onClick={() => hideTemporarily(8)}>Hide for 8 hours</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => hideTemporarily(1)}
        className="h-8 w-8"
        title="Hide command matches for 1 hour"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Hide command matches</span>
      </Button>
    </div>
  )
}

