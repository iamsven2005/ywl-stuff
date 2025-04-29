import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sensors } = body

    if (!sensors || !Array.isArray(sensors)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const createdMetrics = await db.$transaction(
      sensors.map((sensor) =>
        db.system_metrics.create({
          data: {
            host: sensor.host,
            sensor_name: sensor.sensor_name,
            value_type: sensor.value_type,
            value: sensor.value,
          },
        })
      )
    )

    return NextResponse.json({ success: true, data: createdMetrics }, { status: 201 })
  } catch (error) {
    console.error("Sensor log insert failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
