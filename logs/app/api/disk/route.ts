import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { disks } = body

    if (!disks || !Array.isArray(disks)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Insert each disk metric
    const createdDisks = await prisma.$transaction(
      disks.map((disk) =>
        prisma.diskmetric.create({
          data: {
            host: disk.host,
            name: disk.name,
            label: disk.label,
            totalGB: disk.totalGB,
            usedGB: disk.usedGB,
            freeGB: disk.freeGB,
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
