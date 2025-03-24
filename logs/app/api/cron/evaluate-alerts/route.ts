import { NextResponse } from "next/server"
import { runAlertEvaluation } from "@/app/actions/alert-actions"

export async function GET(request: Request) {
  // Check for authorization if needed
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.BACKUP_CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Run the alert evaluation
    const result = await runAlertEvaluation()

    return NextResponse.json({
      success: true,
      message: "Alert evaluation completed successfully",
      results: result.results,
    })
  } catch (error) {
    console.error("Error running alert evaluation:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to run alert evaluation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

