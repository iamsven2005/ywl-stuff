import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const roles = await db.location.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

