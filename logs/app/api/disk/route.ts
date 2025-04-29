import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.disks || !Array.isArray(body.disks)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const created = await db.$transaction(
      body.disks.map((disk: any) =>
        db.diskmetric.create({
          data: {
            host: disk.host,
            name: disk.name,
            label: disk.label,
            totalgb: parseFloat(disk.totalGB),
            usedgb: parseFloat(disk.usedGB),
            freegb: parseFloat(disk.freeGB),
          },
        })
      )
    )

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(created, (_, value) => (typeof value === "bigint" ? value.toString() : value))
      )
    )
  } catch (error) {
    console.error("POST /api/disk error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
