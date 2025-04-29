import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { disks } = body

    if (!disks || !Array.isArray(disks)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Insert each disk metric
    const createdDisks = await db.$transaction(
      disks.map((disk) =>
        db.diskmetric.create({
          data: {
            host: disk.host,
            name: disk.name,
            label: disk.label,
            totalgb: disk.totalGB,
            usedgb: disk.usedGB,
            freegb: disk.freeGB,
          },
        })
      )
    )

    return NextResponse.json({ success: true, data: createdDisks }, { status: 201 })
  } catch (err) {
    console.error("Disk log insert error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
