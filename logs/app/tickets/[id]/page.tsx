import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTicketById } from "@/app/actions/ticket-actions"

import { DatabaseStatusBar } from "@/components/database-status-bar"
import { TicketDetailSkeleton } from "./ticket-detail-skeleton"
import { TicketDetail } from "./ticket-detail"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = Number.parseInt(params.id)

  try {
    const ticket = await getTicketById(id)
    return {
      title: `Ticket #${id}: ${ticket.title}`,
      description: `Support ticket details for ${ticket.title}`,
    }
  } catch (error) {
    return {
      title: "Ticket Not Found",
      description: "The requested ticket could not be found",
    }
  }
}

export default async function TicketPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)

  try {
    const ticket = await getTicketById(id)

    return (
      <div className="container mx-auto py-6">
        <DatabaseStatusBar />

        <Suspense fallback={<TicketDetailSkeleton />}>
          <TicketDetail ticket={ticket} currentUser={undefined} assignableUsers={[]} />
        </Suspense>
      </div>
    )
  } catch (error) {
    notFound()
  }
}

