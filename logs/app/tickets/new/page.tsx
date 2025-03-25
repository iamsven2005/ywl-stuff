import type { Metadata } from "next"
import { NewTicketForm } from "@/app/tickets/new/new-ticket-form"
import { getAssignableUsers } from "@/app/actions/ticket-actions"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "Create New Ticket",
  description: "Create a new support ticket",
}

export default async function NewTicketPage() {
  // Get all devices for the dropdown
  const devices = await db.devices.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  // Get all admin users for assignment
  const assignableUsers = await getAssignableUsers()

  return (
    <div className="container py-6">
      <NewTicketForm deviceNames={devices.map((device) => device.name)} assignableUsers={assignableUsers} />
    </div>
  )
}

