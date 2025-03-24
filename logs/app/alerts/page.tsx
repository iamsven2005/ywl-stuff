import type { Metadata } from "next"
import { getAlertConditions, getAlertEvents } from "../actions/alert-actions"
import { AlertConditionsTable } from "./alert-conditions-table"
import { AlertEventsTable } from "./alert-events-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { AlertStats } from "./alert-stats"
import { DatabaseStatusBar } from "@/components/database-status-bar"

export const metadata: Metadata = {
  title: "Alerts",
  description: "Manage system alerts and notifications",
}

export default async function AlertsPage() {
  // Get alert conditions and recent unresolved events
  const alertConditions = await getAlertConditions()
  const { alertEvents } = await getAlertEvents({ resolved: false, page: 1, pageSize: 10 })

  return (
    <div className="container mx-auto py-6">
      <DatabaseStatusBar />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">Manage system alerts and notifications</p>
        </div>
        <Button asChild>
          <Link href="/alerts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Alert Condition
          </Link>
        </Button>
      </div>

      <AlertStats />

      <Tabs defaultValue="conditions" className="mt-6">
        <TabsList>
          <TabsTrigger value="conditions">Alert Conditions</TabsTrigger>
          <TabsTrigger value="events">
            Active Alerts
            {alertEvents.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
                {alertEvents.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="conditions">
          <AlertConditionsTable initialAlertConditions={alertConditions} />
        </TabsContent>
        <TabsContent value="events">
          <AlertEventsTable initialAlertEvents={alertEvents} showResolved={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

