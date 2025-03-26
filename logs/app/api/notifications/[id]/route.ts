import { type NextRequest, NextResponse } from "next/server"
import { updateNotification, deleteNotification } from "@/app/actions/notification-actions"
import { getCurrentUser } from "@/app/login/actions"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.role.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
    }

    const data = await request.json()

    await updateNotification(id, {
      title: data.title,
      content: data.content,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      important: data.important,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.role.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
    }

    await deleteNotification(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

