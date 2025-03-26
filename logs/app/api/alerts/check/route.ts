import { type NextRequest, NextResponse } from "next/server"
import { runAlertEvaluation } from "@/app/actions/alert-actions"
import { revalidatePath } from "next/cache"

// Reduced cache time for testing
export const revalidate = 10 // 10 seconds for testing

export async function GET(request: NextRequest) {
  try {
    console.log("Alert check API route called")

    // Check if this is a debug request
    const isDebug = request.nextUrl.searchParams.get("debug") === "true"

    if (isDebug) {
      console.log("Running alert evaluation in debug mode")
    }

    const results = await runAlertEvaluation()

    // Count triggered alerts
    const triggeredCount = results.results.filter((r) => r.triggered).length
    console.log(`Alert evaluation complete. Found ${triggeredCount} triggered alerts.`)

    // Revalidate the alerts page to show the new events
    revalidatePath("/alerts")

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error("Error checking alerts:", error)
    return NextResponse.json(
      { error: "Failed to check alerts", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

