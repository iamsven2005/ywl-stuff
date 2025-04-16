import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { evaluateAlertCondition, getAlertConditions, createAlertEvent } from "@/app/actions/alert-actions"
import { revalidatePath } from "next/cache"


export async function GET(request: NextRequest) {
  try {
    const useExtendedWindow = request.nextUrl.searchParams.get("extended") === "true"
    const createEvents = request.nextUrl.searchParams.get("createEvents") === "true"

    console.log(`Running debug alert check with extended window: ${useExtendedWindow}, createEvents: ${createEvents}`)

    // Get all alert conditions
    const conditions = await getAlertConditions()
    console.log(`Found ${conditions.length} alert conditions to evaluate`)

    // Evaluate each condition
    const results = []
    for (const condition of conditions) {
      try {
        console.log(`Evaluating condition: ${condition.name}`)

        // Get all logs for this condition for debugging
        let matchingLogs: { name: string; id: number; host: string | null; timestamp: Date; piuser: string | null; pid: number | null; action: string | null; cpu: number | null; mem: number | null; command: string | null; port: number | null; ipAddress: string | null }[] = []
        if (condition.sourceTable === "logs") {
          matchingLogs = await db.logs.findMany({
            where: {
              ...(condition.fieldName === "command" && condition.comparator === "contains"
                ? { command: { contains: condition.thresholdValue, mode: "insensitive" } }
                : {}),
            },
            take: 10,
          })
          console.log(`Direct DB query found ${matchingLogs.length} matching logs`)
          matchingLogs.forEach((log) => {
            console.log(`Matching log: command="${log.command}", timestamp=${log.timestamp}`)
          })
        }

        const evaluation = await evaluateAlertCondition(condition.id)

        // Create an actual alert event if requested and condition is triggered
        let alertEventId = null
        if (createEvents && evaluation.shouldTrigger) {
          try {
            const notes = `Alert triggered by debug check: ${evaluation.data?.reason || "Condition met"}`
            const result = await createAlertEvent(condition.id, notes)
            alertEventId = result.alertEvent.id
            console.log(`Created alert event ${alertEventId} for condition ${condition.id}`)
          } catch (eventError) {
            console.error(`Error creating alert event for condition ${condition.id}:`, eventError)
          }
        }

        results.push({
          id: condition.id,
          name: condition.name,
          triggered: evaluation.shouldTrigger,
          reason: evaluation.data?.reason || "Condition not evaluated",
          alertEventId,
          condition: {
            sourceTable: condition.sourceTable,
            fieldName: condition.fieldName,
            comparator: condition.comparator,
            thresholdValue: condition.thresholdValue,
            timeWindowMin: condition.timeWindowMin,
            countThreshold: condition.countThreshold,
          },
          matchCount: matchingLogs.length,
          sampleMatches: matchingLogs.slice(0, 3).map((log) => ({
            command: log.command,
            timestamp: log.timestamp,
          })),
        })
      } catch (error) {
        console.error(`Error evaluating condition ${condition.id}:`, error)
        results.push({
          id: condition.id,
          name: condition.name,
          triggered: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Revalidate the alerts page to show the new events
    if (createEvents) {
      revalidatePath("/alerts")
    }

    return NextResponse.json({ results }, { status: 200 })
  } catch (error) {
    console.error("Error in debug alert check:", error)
    return NextResponse.json(
      { error: "Failed to run debug alert check", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

