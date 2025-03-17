import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const emailTemplates = await db.emailTemplate.findMany({
      select: {
        id: true,
        name: true,
        subject: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(emailTemplates)
  } catch (error) {
    console.error("Error fetching email templates:", error)
    return NextResponse.json({ error: "Failed to fetch email templates" }, { status: 500 })
  }
}

