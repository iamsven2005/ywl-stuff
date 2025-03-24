"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAlertConditions, getAlertEvents } from "../actions/alert-actions"
import { AlertCircle, Bell, CheckCircle, Clock } from "lucide-react"

export function AlertStats() {
  const [stats, setStats] = useState({
    totalConditions: 0,
    activeConditions: 0,
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedAlerts: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get alert conditions
        const conditions = await getAlertConditions()
        const activeConditions = conditions.filter((c) => c.active)

        // Get alert events
        const allEvents = await getAlertEvents({ page: 1, pageSize: 1000 })
        const activeEvents = await getAlertEvents({ resolved: false, page: 1, pageSize: 1000 })

        setStats({
          totalConditions: conditions.length,
          activeConditions: activeConditions.length,
          totalAlerts: allEvents.totalCount,
          activeAlerts: activeEvents.totalCount,
          resolvedAlerts: allEvents.totalCount - activeEvents.totalCount,
        })
      } catch (error) {
        console.error("Error fetching alert stats:", error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Alert Conditions</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalConditions}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeConditions} active, {stats.totalConditions - stats.activeConditions} inactive
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeAlerts}</div>
          <p className="text-xs text-muted-foreground">Unresolved alerts requiring attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolved Alerts</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.resolvedAlerts}</div>
          <p className="text-xs text-muted-foreground">Previously triggered and resolved alerts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAlerts}</div>
          <p className="text-xs text-muted-foreground">All-time alert events in the system</p>
        </CardContent>
      </Card>
    </div>
  )
}

