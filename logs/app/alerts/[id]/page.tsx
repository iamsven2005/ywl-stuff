import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getAlertCondition, getAlertEvents } from "@/app/actions/alert-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertEventsTable } from "../alert-events-table"
import { Edit, Bell, Clock, AlertCircle, CheckCircle, ExternalLink } from "lucide-react"
import { DatabaseStatusBar } from "@/components/database-status-bar"
import { getCurrentUser } from "@/app/login/actions"
import { checkUserPermission } from "@/app/actions/permission-actions"

export const metadata: Metadata = {
  title: "Alert Condition Details",
  description: "View alert condition details and history",
}

export default async function AlertConditionDetailPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
  }
  const perm = await checkUserPermission(currentUser.id, "/alerts")
  if (perm.hasPermission === false) {
    return notFound()
  }
  // Get the alert condition
  const alertCondition = await getAlertCondition(id).catch(() => null)

  if (!alertCondition) {
    notFound()
  }

  // Get recent alert events for this condition
  const { alertEvents } = await getAlertEvents({ conditionId: id, page: 1, pageSize: 10 })

  // Format date for display
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A"
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return date.toLocaleString()
  }

  // Format the comparator for display
  const formatComparator = (comparator: string) => {
    switch (comparator) {
      case ">":
        return "greater than"
      case ">=":
        return "greater than or equal to"
      case "<":
        return "less than"
      case "<=":
        return "less than or equal to"
      case "==":
        return "equal to"
      case "!=":
        return "not equal to"
      case "contains":
        return "contains"
      case "not_contains":
        return "does not contain"
      case "equals":
        return "equals"
      default:
        return comparator
    }
  }

  // Format the source table for display
  const formatSourceTable = (sourceTable: string) => {
    switch (sourceTable) {
      case "system_metrics":
        return "System Metrics"
      case "auth":
        return "Auth Logs"
      case "logs":
        return "System Logs"
      default:
        return sourceTable
    }
  }

  return (
    <div className="container mx-auto py-6">
      <DatabaseStatusBar />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{alertCondition.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{formatSourceTable(alertCondition.sourceTable)}</Badge>
            {alertCondition.active ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                Inactive
              </Badge>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/alerts/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alert Condition</CardTitle>
            <CardDescription>Details of this alert condition</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Condition</dt>
                <dd className="mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {alertCondition.fieldName} {alertCondition.comparator} {alertCondition.thresholdValue}
                  </code>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Time Window</dt>
                <dd className="mt-1">
                  {alertCondition.timeWindowMin ? `${alertCondition.timeWindowMin} minutes` : "Not set"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Count Threshold</dt>
                <dd className="mt-1">
                  {alertCondition.countThreshold ? `${alertCondition.countThreshold} occurrences` : "Not set"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Repeat Interval</dt>
                <dd className="mt-1">
                  {alertCondition.repeatIntervalMin ? `${alertCondition.repeatIntervalMin} minutes` : "Not set"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Triggered</dt>
                <dd className="mt-1">{formatDate(alertCondition.lastTriggeredAt)}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email Template</dt>
                <dd className="mt-1">
                  {alertCondition.emailTemplate ? (
                    <Link
                      href={`/email-templates/${alertCondition.emailTemplate.id}`}
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      {alertCondition.emailTemplate.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    "None"
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alert Statistics</CardTitle>
            <CardDescription>Recent alert activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-2xl font-bold">{alertEvents.filter((e) => !e.resolved).length}</span>
                <span className="text-sm text-muted-foreground">Active Alerts</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-2xl font-bold">{alertEvents.filter((e) => e.resolved).length}</span>
                <span className="text-sm text-muted-foreground">Resolved Alerts</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
                <Bell className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-2xl font-bold">{alertEvents.length}</span>
                <span className="text-sm text-muted-foreground">Total Alerts</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
                <Clock className="h-8 w-8 text-amber-500 mb-2" />
                <span className="text-2xl font-bold">
                  {alertCondition.triggeredAlerts.length > 0
                    ? new Date(alertCondition.triggeredAlerts[0].triggeredAt).toLocaleDateString()
                    : "Never"}
                </span>
                <span className="text-sm text-muted-foreground">Last Alert</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Alert History</h2>
        <AlertEventsTable initialAlertEvents={alertEvents} showResolved={true} />
      </div>
    </div>
  )
}

