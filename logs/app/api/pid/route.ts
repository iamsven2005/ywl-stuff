import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, pid, user, cpu, mem, command, host } = body
    if (!action || !pid || !command || !host) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const entry = await db.logs.create({
      data: {
        action,
        pid,
        name: "process",
        piuser: user,
        cpu,
        mem,
        command,
        host,
      },
    })

    return NextResponse.json({ success: true, entry }, { status: 201 })
  } catch (error) {
    console.error("PID log insert failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
