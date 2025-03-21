import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function TicketNotFound() {
  return (
    <div className="container mx-auto py-12">
      <div className="flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Ticket Not Found</h1>
        <p className="text-muted-foreground mb-6">The ticket you are looking for does not exist or has been deleted.</p>
        <Link href="/tickets">
          <Button>Return to Tickets</Button>
        </Link>
      </div>
    </div>
  )
}

