import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { log_entry, username } = body
    console.log(body)
    if (!log_entry || !username) {
      return NextResponse.json({ error: "Missing log_entry or username" }, { status: 400 })
    }

    const newLog = await db.auth.create({
      data: {
        log_entry,
        username,
      },
    })

    return NextResponse.json({ success: true, data: newLog }, { status: 201 })
  } catch (err) {
    console.error("Auth log insert error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
