import { Skeleton } from "@/components/ui/skeleton"

export function DriveSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-4" />
        <Skeleton className="h-6 w-16" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}

