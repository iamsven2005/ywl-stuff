"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface DatabaseStatusBarProps {
  onRetry?: () => void
  className?: string
}

export function DatabaseStatusBar({ onRetry, className = "" }: DatabaseStatusBarProps) {
  const [isDatabaseDown, setIsDatabaseDown] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const checkDatabaseStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/health-check", {
        method: "GET",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setIsDatabaseDown(!data.healthy)
    } catch (error) {
      console.error("Database health check error:", error)
      setIsDatabaseDown(true)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDatabaseStatus()

    // Check database status every 30 seconds
    const interval = setInterval(checkDatabaseStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isChecking || !isDatabaseDown) {
    return null
  }

  return (
    <Alert variant="destructive" className={`mb-4 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Database className="h-4 w-4" /> Database Connection Error
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          Unable to connect to the database. This could be due to network issues, database server downtime, or
          configuration problems.
        </p>
        {onRetry && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                checkDatabaseStatus()
                onRetry()
              }}
            >
              Retry Connection
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

