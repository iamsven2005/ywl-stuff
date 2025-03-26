"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle2, AlertCircle, Bug, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export function AlertDebugPanel() {
  const [useExtendedWindow, setUseExtendedWindow] = useState(true)
  const [createEvents, setCreateEvents] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const runDebugCheck = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/alerts/debug?extended=${useExtendedWindow}&createEvents=${createEvents}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setResults(data.results || [])

      // Show toast with summary
      const triggeredCount = data.results.filter((r: any) => r.triggered).length
      if (triggeredCount > 0) {
        toast.error("No alert events were created. Enable 'Create Alert Events' to create actual alerts.")
      } else {
        toast.error("Check the debug results for more information.")
      }
    } catch (error) {
      console.error("Error running debug check:", error)
      toast("Error running debug check")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg font-medium">
          <Bug className="mr-2 h-5 w-5" />
          Alert Debugging
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test alert conditions with extended options to help diagnose issues.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="extended-window">Use extended time window (100x)</Label>
            <span className="text-xs text-muted-foreground">Extends the time window to catch older logs</span>
          </div>
          <Switch id="extended-window" checked={useExtendedWindow} onCheckedChange={setUseExtendedWindow} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="create-events">Create Alert Events</Label>
            <span className="text-xs text-muted-foreground">Actually create alert events in the database</span>
          </div>
          <Switch id="create-events" checked={createEvents} onCheckedChange={setCreateEvents} />
        </div>

        <Button variant="default" className="w-full" onClick={runDebugCheck} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Bug className="mr-2 h-4 w-4" />
              Run Debug Alert Check
            </>
          )}
        </Button>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            <h3 className="font-medium">Results:</h3>
            <Accordion type="single" collapsible className="w-full">
              {results.map((result) => (
                <AccordionItem key={result.id} value={result.name}>
                  <AccordionTrigger className="flex items-center">
                    {result.triggered ? (
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="mr-2 h-4 w-4 text-gray-400" />
                    )}
                    <span className={result.triggered ? "font-medium" : ""}>
                      {result.triggered ? "Triggered" : "Not Triggered"}
                    </span>
                    <span className="ml-2">{result.name}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="font-medium">Condition:</div>
                        <div className="col-span-2">
                          {result.condition?.fieldName} {result.condition?.comparator}{" "}
                          {result.condition?.thresholdValue}
                        </div>

                        <div className="font-medium">Source:</div>
                        <div className="col-span-2">{result.condition?.sourceTable}</div>

                        <div className="font-medium">Time Window:</div>
                        <div className="col-span-2">
                          {result.condition?.timeWindowMin} min {useExtendedWindow && "(extended)"}
                        </div>

                        <div className="font-medium">Count Threshold:</div>
                        <div className="col-span-2">{result.condition?.countThreshold || "N/A"}</div>

                        <div className="font-medium">Matching Entries:</div>
                        <div className="col-span-2">{result.matchCount || 0}</div>

                        {result.alertEventId && (
                          <>
                            <div className="font-medium">Alert Event:</div>
                            <div className="col-span-2">Created (ID: {result.alertEventId})</div>
                          </>
                        )}
                      </div>

                      <div>
                        <div className="font-medium">Reason:</div>
                        <div className="mt-1 rounded bg-muted p-2 text-xs">{result.reason || "No reason provided"}</div>
                      </div>

                      {result.sampleMatches && result.sampleMatches.length > 0 && (
                        <div>
                          <div className="font-medium">Sample Matches:</div>
                          <div className="mt-1 space-y-1">
                            {result.sampleMatches.map((match: any, index: number) => (
                              <div key={index} className="rounded bg-muted p-2 text-xs">
                                <div>Command: {match.command}</div>
                                <div>Timestamp: {new Date(match.timestamp).toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.error && (
                        <div>
                          <div className="font-medium text-red-500">Error:</div>
                          <div className="mt-1 rounded bg-red-50 p-2 text-xs text-red-500">{result.error}</div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

