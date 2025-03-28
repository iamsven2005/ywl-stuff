"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X } from "lucide-react"
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
import { getUnresolvedAlertCount } from "@/app/actions/alert-actions"
import { toast } from "sonner"

// Add this interface to define the shape of an alert
interface AlertEventProps {
  id: number
  conditionId: number
  conditionName: string
  triggeredAt: Date
  notes?: string | null
}

export function AlertNotification({ alerts = [] }: { alerts: AlertEventProps[] }) {
  const router = useRouter()
  const [unresolvedCount, setUnresolvedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  // Add hideUntil state
  const [hideUntil, setHideUntil] = useState<number | null>(null)

  // Add a function to hide alerts temporarily
  const hideTemporarily = (hours: number) => {
    const hideUntilTime = Date.now() + hours * 60 * 60 * 1000
    setHideUntil(hideUntilTime)
    localStorage.setItem("alertsHideUntil", hideUntilTime.toString())
    toast.success(`Alerts hidden for ${hours} hour${hours > 1 ? "s" : ""}`)
  }

  useEffect(() => {
    const fetchUnresolvedCount = async () => {
      try {
        const count = await getUnresolvedAlertCount()
        setUnresolvedCount(count)
      } catch (error) {
        console.error("Error fetching unresolved alert count:", error)
      }
    }

    fetchUnresolvedCount()

    // Set up polling to check for new alerts every minute
    const interval = setInterval(fetchUnresolvedCount, 60000)
    return () => clearInterval(interval)
  }, [])

  // Check localStorage on component mount
  useEffect(() => {
    const storedHideUntil = localStorage.getItem("alertsHideUntil")
    if (storedHideUntil) {
      const hideTime = Number.parseInt(storedHideUntil)
      if (hideTime > Date.now()) {
        setHideUntil(hideTime)
      } else {
        localStorage.removeItem("alertsHideUntil")
      }
    }
  }, [])

  // Update count when alerts prop changes
  useEffect(() => {
    if (alerts.length > 0) {
      setUnresolvedCount((prev) => prev + alerts.length)

      // Show toast notification for new alerts
      alerts.forEach((alert) => {
        toast.error(`Alert Triggered: "${alert.conditionName}"`, {
          description: alert.notes || "Check alerts for details",
          duration: 5000,
        })
      })
    }
  }, [alerts])

  const handleViewAll = () => {
    router.push("/alerts")
  }

  const handleMarkAllAsResolved = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/alerts/resolve-all", {
        method: "POST",
      })

      if (response.ok) {
        setUnresolvedCount(0)
        toast.success("All alerts marked as resolved")
      } else {
        toast.error("Failed to mark all alerts as resolved")
      }
    } catch (error) {
      console.error("Error marking all alerts as resolved:", error)
      toast.error("Failed to mark all alerts as resolved")
    } finally {
      setLoading(false)
    }
  }

  // Add this check before the return null statement
  if (unresolvedCount === 0 || (hideUntil && hideUntil > Date.now())) {
    return null
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <AlertTriangle className="h-4 w-4" />
            <Badge
              className="absolute -top-2 -right-2 px-1 min-w-[18px] h-[18px] text-[10px] flex items-center justify-center"
              variant="destructive"
            >
              {unresolvedCount}
            </Badge>
            <span className="sr-only">Active alerts</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[300px]">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Active Alerts</span>
            <Badge variant="outline">{unresolvedCount} unresolved</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleViewAll}>View all alerts</DropdownMenuItem>
            <DropdownMenuItem onClick={handleMarkAllAsResolved} disabled={loading}>
              {loading ? "Processing..." : "Mark all as resolved"}
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
        title="Hide alerts for 1 hour"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Hide alerts</span>
      </Button>
    </div>
  )
}

