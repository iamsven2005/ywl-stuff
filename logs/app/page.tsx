import { Suspense } from "react"
import LogsTable from "./logs-table"
import { LogsTableSkeleton } from "./logs-table-skeleton"

export default function LogsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Logs</h1>
      <Suspense fallback={<LogsTableSkeleton />}>
        <LogsTable />
      </Suspense>
    </div>
  )
}

