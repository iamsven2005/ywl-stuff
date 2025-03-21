"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getTicketStats } from "@/app/actions/ticket-actions"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"

export function TicketStats() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getTicketStats()
        setStats(data)
      } catch (error) {
        toast.error("Failed to load ticket statistics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Ticket Overview</CardTitle>
          <CardDescription>Loading ticket statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle>Ticket Overview</CardTitle>
        <CardDescription>Current status of support tickets</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="mb-4">
            <TabsTrigger value="status">By Status</TabsTrigger>
            <TabsTrigger value="priority">By Priority</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Open</span>
                </div>
                <span className="text-2xl font-bold">{stats.statusCounts.open || 0}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">In Progress</span>
                </div>
                <span className="text-2xl font-bold">{stats.statusCounts.in_progress || 0}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Resolved</span>
                </div>
                <span className="text-2xl font-bold">{stats.statusCounts.resolved || 0}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Closed</span>
                </div>
                <span className="text-2xl font-bold">{stats.statusCounts.closed || 0}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="priority">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                <span className="font-medium mb-2">Low</span>
                <span className="text-2xl font-bold">{stats.priorityCounts.low || 0}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                <span className="font-medium mb-2">Medium</span>
                <span className="text-2xl font-bold">{stats.priorityCounts.medium || 0}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg">
                <span className="font-medium mb-2">High</span>
                <span className="text-2xl font-bold">{stats.priorityCounts.high || 0}</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg">
                <span className="font-medium mb-2">Critical</span>
                <span className="text-2xl font-bold">{stats.priorityCounts.critical || 0}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <h3 className="text-sm font-medium mb-2">Recent Tickets</h3>
          <div className="space-y-2">
            {stats.recentTickets.map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                <div>
                  <a href={`/tickets/${ticket.id}`} className="font-medium hover:underline">
                    {ticket.title}
                  </a>
                  <div className="text-xs text-muted-foreground">
                    By {ticket.createdBy.username} • {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ticket.status === "open" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Open
                    </Badge>
                  )}
                  {ticket.status === "in_progress" && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      In Progress
                    </Badge>
                  )}
                  {ticket.status === "resolved" && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Resolved
                    </Badge>
                  )}
                  {ticket.status === "closed" && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Closed
                    </Badge>
                  )}

                  {ticket.priority === "low" && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Low
                    </Badge>
                  )}
                  {ticket.priority === "medium" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Medium
                    </Badge>
                  )}
                  {ticket.priority === "high" && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      High
                    </Badge>
                  )}
                  {ticket.priority === "critical" && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Critical
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

