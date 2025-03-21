import type { Metadata } from "next"
import { NewTicketForm } from "@/app/tickets/new/new-ticket-form"
import { getAllDeviceNames } from "@/app/actions/device-actions"
import { DatabaseStatusBar } from "@/components/database-status-bar"

export const metadata: Metadata = {
  title: "Create New Ticket",
  description: "Create a new support ticket",
}

export default async function NewTicketPage() {
  // Get all devices for the dropdown
  const deviceNames = (await getAllDeviceNames()) || []

  return (
    <div className="container mx-auto py-6">
      <DatabaseStatusBar />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Ticket</h1>
        <p className="text-muted-foreground">Submit a new support request</p>
      </div>

      <NewTicketForm deviceNames={deviceNames} />
    </div>
  )
}

