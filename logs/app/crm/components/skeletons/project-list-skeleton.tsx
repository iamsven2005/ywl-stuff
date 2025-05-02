import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectListSkeleton() {
  return (
    <div className="border rounded-md">
      <div className="grid grid-cols-5 p-4 font-medium border-b">
        <div>Project Name</div>
        <div>Bridge Type</div>
        <div>Location</div>
        <div>Status</div>
        <div>Completion</div>
      </div>
      <div className="divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 p-4">
            <div>
              <Skeleton className="h-5 w-40" />
            </div>
            <div>
              <Skeleton className="h-5 w-24" />
            </div>
            <div>
              <Skeleton className="h-5 w-32" />
            </div>
            <div>
              <Skeleton className="h-5 w-20" />
            </div>
            <div>
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
