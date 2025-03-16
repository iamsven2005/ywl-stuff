import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LogsTable from "../tables/logs-table"
import AuthLogsTable from "../tables/auth-logs-table"
import { LogsTableSkeleton } from "../tables/logs-table-skeleton"
import { ThemeToggle } from "../theme-toggle"
import UsageChart from "../charts/usage-chart"
import MemoryUsageChart from "../charts/memory-usage-chart"
import SensorChart from "../charts/sensor-chart"
import DevicesTable from "../tables/devices-table"
import NotesTable from "../actions/notes-table"
import UsersTable from "../tables/users-table"
import RulesTable from "../tables/rules-table"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { UserNav } from "@/components/user-nav"

export default function LogsPage() {
  // Check if user is logged in
  const cookieStore = cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) {
    redirect("/login")
  }

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Logs</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Suspense fallback={<div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-md"></div>}>
          <UsageChart />
        </Suspense>

        <Suspense fallback={<div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-md"></div>}>
          <MemoryUsageChart />
        </Suspense>

        <Suspense fallback={<div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-md"></div>}>
          <SensorChart />
        </Suspense>
      </div>

      <Tabs defaultValue="system-logs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="system-logs">System Logs</TabsTrigger>
          <TabsTrigger value="auth-logs">Auth Logs</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="system-logs">
          <Suspense fallback={<LogsTableSkeleton />}>
            <LogsTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="auth-logs">
          <Suspense fallback={<LogsTableSkeleton />}>
            <AuthLogsTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="devices">
          <Suspense fallback={<LogsTableSkeleton />}>
            <DevicesTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="users">
          <Suspense fallback={<LogsTableSkeleton />}>
            <UsersTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="rules">
          <Suspense fallback={<LogsTableSkeleton />}>
            <RulesTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="notes">
          <Suspense fallback={<LogsTableSkeleton />}>
            <NotesTable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

