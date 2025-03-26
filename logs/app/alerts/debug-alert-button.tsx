"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { runAlertEvaluation } from "@/app/actions/alert-actions"
import { toast } from "sonner"

export function DebugAlertButton() {
  const [isChecking, setIsChecking] = useState(false)

  const handleCheck = async () => {
    try {
      setIsChecking(true)
      toast.info("Checking alert conditions with debug logging...")

      const result = await runAlertEvaluation()

      if (result.results.some((r) => r.triggered)) {
        toast.success(`Alert triggered! ${result.results.filter((r) => r.triggered).length} conditions met.`)
      } else {
        toast.info("No alerts triggered. Check console for debug logs.")
      }

      console.log("Alert evaluation results:", result)
    } catch (error) {
      console.error("Error checking alerts:", error)
      toast.error("Error checking alerts. See console for details.")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCheck} disabled={isChecking}>
      {isChecking ? "Checking..." : "Debug Alert Check"}
    </Button>
  )
}

