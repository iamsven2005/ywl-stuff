import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

// Safely handle BigInt serialization
function safeJson(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (typeof value === "bigint" ? value.toString() : value))
  )
}

export async function POST(req: NextRequest) {
  try {
    const {
      host,
      total_memory,
      used_memory,
      free_memory,
      available_memory,
      percent_usage,
    } = await req.json()

    if (!host || total_memory == null || used_memory == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const record = await db.memory_usage.create({
      data: {
        host,
        total_memory,
        used_memory,
        free_memory,
        available_memory,
        percent_usage,
      },
    })

    return NextResponse.json(safeJson({ success: true, data: record }), { status: 201 })
  } catch (error) {
    console.error("Error saving memory usage:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
