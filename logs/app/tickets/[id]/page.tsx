import { notFound } from "next/navigation"
import { getTicket, getAssignableUsers } from "@/app/actions/ticket-actions"
import { TicketDetailSkeleton } from "./ticket-detail-skeleton"
import { TicketDetail } from "./ticket-detail"
import { Suspense } from "react"
import { getCurrentUser } from "@/app/login/actions"

export default async function TicketPage({ params }: { params: { id: string } }) {
  const ticketId = Number.parseInt(params.id)

  if (isNaN(ticketId)) {
    return notFound()
  }
  const user =  await getCurrentUser()
  console.log(user)
  const ticketPromise = getTicket(ticketId)
  const usersPromise = getAssignableUsers()

  const [ticket, assignableUsers] = await Promise.all([ticketPromise, usersPromise])

  if (!ticket) {
    return notFound()
  }

  return (
    <div className="container py-6">
      <Suspense fallback={<TicketDetailSkeleton />}>
        <TicketDetail ticket={ticket} assignableUsers={assignableUsers} currentUser={user} />
      </Suspense>
    </div>
  )
}

