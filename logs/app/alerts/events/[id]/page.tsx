import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getAlertEvent, resolveAlertEvent } from "@/app/actions/alert-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Bell, CheckCircle } from "lucide-react"
import { DatabaseStatusBar } from "@/components/database-status-bar"

export const metadata: Metadata = {
  title: "Alert Event Details",
  description: "View alert event details",
}

export default async function AlertEventDetailPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)

  // Get the alert event
  const alertEvent = await getAlertEvent(id).catch(() => null)

  if (!alertEvent) {
    notFound()
  }

  // Format date for display
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A"
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return date.toLocaleString()
  }

  return (
    <div className="container mx-auto py-6">
      <DatabaseStatusBar />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Alert Event</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{alertEvent.alertCondition.name}</Badge>
            {alertEvent.resolved ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="mr-1 h-3 w-3" />
                Resolved
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <AlertCircle className="mr-1 h-3 w-3" />
                Active
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/alerts/${alertEvent.alertCondition.id}`}>
              <Bell className="mr-2 h-4 w-4" />
              View Condition
            </Link>
          </Button>
          {!alertEvent.resolved && (
            <form
              action={async () => {
                "use server"
                await resolveAlertEvent(alertEvent.id, "Manually resolved from alert details page")
              }}
            >
              <Button type="submit">
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolve Alert
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alert Details</CardTitle>
            <CardDescription>Information about this alert event</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Alert Condition</dt>
                <dd className="mt-1">
                  <Link href={`/alerts/${alertEvent.alertCondition.id}`} className="text-blue-600 hover:underline">
                    {alertEvent.alertCondition.name}
                  </Link>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Triggered At</dt>
                <dd className="mt-1">{formatDate(alertEvent.triggeredAt)}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  {alertEvent.resolved ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Resolved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Active
                    </span>
                  )}
                </dd>
              </div>

              {alertEvent.resolved && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Resolved At</dt>
                  <dd className="mt-1">{formatDate(alertEvent.resolvedAt)}</dd>
                </div>
              )}

              {alertEvent.notes && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap bg-muted/20 p-3 rounded-md text-sm">{alertEvent.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Condition Details</CardTitle>
            <CardDescription>The condition that triggered this alert</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Condition</dt>
                <dd className="mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {alertEvent.alertCondition.fieldName} {alertEvent.alertCondition.comparator}{" "}
                    {alertEvent.alertCondition.thresholdValue}
                  </code>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Source Table</dt>
                <dd className="mt-1">{alertEvent.alertCondition.sourceTable}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Time Window</dt>
                <dd className="mt-1">
                  {alertEvent.alertCondition.timeWindowMin
                    ? `${alertEvent.alertCondition.timeWindowMin} minutes`
                    : "Not set"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email Notification</dt>
                <dd className="mt-1">
                  {alertEvent.alertCondition.emailTemplate ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Sent using template: {alertEvent.alertCondition.emailTemplate.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No email template configured</span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

