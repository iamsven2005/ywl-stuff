"use client"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
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

  if (unresolvedCount === 0) {
    return null
  }

  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

