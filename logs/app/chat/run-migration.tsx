"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function RunMigration() {
  const [running, setRunning] = useState(false)

  const handleMigration = async () => {
    setRunning(true)
    try {
      // In a real app, you would call an API endpoint to run the migration
      // For this example, we'll just simulate it
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("Migration completed successfully")
    } catch (error) {
      toast.error("Migration failed")
    } finally {
      setRunning(false)
    }
  }

  return (
    <Button onClick={handleMigration} disabled={running}>
      {running ? "Running migration..." : "Run migration"}
    </Button>
  )
}

