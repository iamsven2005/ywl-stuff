import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Add error handling for JSON parsing
    let matchIds, notes
    try {
      const body = await request.json()
      matchIds = body.matchIds
      notes = body.notes
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json({ error: "No match IDs provided" }, { status: 400 })
    }

    // Update all the specified matches
    const result = await db.commandMatch.updateMany({
      where: {
        id: {
          in: matchIds,
        },
        addressed: false, // Only update unaddressed matches
      },
      data: {
        addressed: true,
        addressedBy: userId,
        addressedAt: new Date(),
        notes: notes || "Bulk addressed by user",
      },
    })

    // Log the activity
    await logActivity({
      actionType: "Command Matches Addressed",
      targetType: "CommandMatch",
      targetId: 0,
      details: `Marked ${result.count} command matches as addressed`,
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error("Error bulk addressing command matches:", error)
    return NextResponse.json({ error: "Failed to address command matches" }, { status: 500 })
  }
}

