import { Skeleton } from "@/components/ui/skeleton"
import { TicketsTableSkeleton } from "./tickets-table-skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>

      <TicketsTableSkeleton />
    </div>
  )
}

