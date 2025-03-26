"use client"

import { useEffect, useState, useRef } from "react"
import { checkAlertConditionsRealtime } from "@/app/actions/alert-actions"
import { AlertNotification } from "./alert-notification"

export function AlertMonitor() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const lastCheckedRef = useRef<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Function to check for new alerts
    const checkForAlerts = async () => {
      // Prevent concurrent checks
      if (isChecking) return

      // Don't check more often than every 5 minutes
      const now = new Date()
      const timeSinceLastCheck = now.getTime() - lastCheckedRef.current.getTime()
      if (timeSinceLastCheck < 5 * 60 * 1000 && lastCheckedRef.current.getTime() !== new Date(0).getTime()) return

      try {
        setIsChecking(true)
        const newAlerts = await checkAlertConditionsRealtime()

        // Only add alerts that were triggered after our last check
        const filteredAlerts = newAlerts.filter((alert) => new Date(alert.triggeredAt) > lastCheckedRef.current)

        if (filteredAlerts.length > 0) {
          setAlerts(filteredAlerts)
        }

        lastCheckedRef.current = now
      } catch (error) {
        console.error("Error checking for alerts:", error)
      } finally {
        setIsChecking(false)
      }
    }

    // Only set up the interval once
    if (!intervalRef.current) {
      // Initial check after a 10-second delay to prevent immediate checking on page load
      const initialTimeout = setTimeout(() => {
        checkForAlerts()

        // Then set up the regular interval (every 5 minutes)
        intervalRef.current = setInterval(checkForAlerts, 5 * 60 * 1000)
      }, 10000)

      // Clean up the initial timeout
      return () => clearTimeout(initialTimeout)
    }

    // Clean up the interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isChecking]) // Only depend on isChecking to prevent unnecessary re-renders

  return <AlertNotification alerts={alerts} />
}

