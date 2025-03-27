import { Skeleton } from "@/components/ui/skeleton"

export function ChatSkeleton() {
  return (
    <div className="flex h-full">
      {/* Sidebar skeleton */}
      <div className="w-80 border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
              <Skeleton className={`h-20 ${i % 2 === 0 ? "w-2/3" : "w-1/2"} rounded-lg`} />
            </div>
          ))}
        </div>

        <div className="p-4 border-t">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

