import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log("Received data:", data)

    if (!Array.isArray(data)) {
      return NextResponse.json({ success: false, error: "Expected array of JSON objects" }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const record of data) {
      try {
        const saved = await db.temp.create({ data: record })
        results.push(saved)
      } catch (err) {
        console.error("Error saving record:", record)
        console.error("Details:", err)
        errors.push({ record, error: err instanceof Error ? err.message : String(err) })
      }
    }

    return NextResponse.json({
      success: true,
      saved: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Request parsing or processing failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
