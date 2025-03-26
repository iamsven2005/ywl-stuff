"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getTicketStats } from "@/app/actions/ticket-actions"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Clock, XCircle, BarChart3, Users, Calendar, TrendingUp } from "lucide-react"

export function TicketStats() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getTicketStats()
        setStats(data)
      } catch (error) {
        console.error("Error fetching ticket stats:", error)
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

  // If stats is null or doesn't have the expected structure, show a fallback
  if (!stats) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Ticket Overview</CardTitle>
          <CardDescription>No ticket statistics available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    )
  }

  // Extract the correct properties from the stats object
  const statusCounts = stats.byStatus || { open: 0, in_progress: 0, resolved: 0, closed: 0 }
  const priorityCounts = stats.byPriority || { low: 0, medium: 0, high: 0, critical: 0 }
  const recentTickets = stats.recentTickets || []
  const totalTickets = stats.totalTickets || 0
  const ticketsThisWeek = stats.ticketsThisWeek || 0
  const ticketsLastWeek = stats.ticketsLastWeek || 0
  const percentChange = stats.percentChange || 0
  const avgResolutionTime = stats.avgResolutionTime || 0
  const topAssignees = stats.topAssignees || []

  return (
    <div className="space-y-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">{totalTickets}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New This Week</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{ticketsThisWeek}</p>
                  {percentChange !== 0 && (
                    <Badge variant={percentChange > 0 ? "destructive" : "secondary"} className="text-xs">
                      {percentChange > 0 ? "+" : ""}
                      {percentChange}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{ticketsLastWeek} tickets last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</p>
                <p className="text-3xl font-bold">{avgResolutionTime} hrs</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                <p className="text-3xl font-bold">{statusCounts.open + statusCounts.in_progress}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{statusCounts.in_progress} in progress</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Ticket Breakdown</CardTitle>
          <CardDescription>Current status of support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList className="mb-4">
              <TabsTrigger value="status">By Status</TabsTrigger>
              <TabsTrigger value="priority">By Priority</TabsTrigger>
              <TabsTrigger value="assignees">Top Assignees</TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Open</span>
                  </div>
                  <span className="text-2xl font-bold">{statusCounts.open || 0}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {Math.round((statusCounts.open / totalTickets) * 100) || 0}% of total
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">In Progress</span>
                  </div>
                  <span className="text-2xl font-bold">{statusCounts.in_progress || 0}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {Math.round((statusCounts.in_progress / totalTickets) * 100) || 0}% of total
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Resolved</span>
                  </div>
                  <span className="text-2xl font-bold">{statusCounts.resolved || 0}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {Math.round((statusCounts.resolved / totalTickets) * 100) || 0}% of total
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Closed</span>
                  </div>
                  <span className="text-2xl font-bold">{statusCounts.closed || 0}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {Math.round((statusCounts.closed / totalTickets) * 100) || 0}% of total
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="priority">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg">
                  <span className="font-medium mb-2">Low</span>
                  <span className="text-2xl font-bold">{priorityCounts.low || 0}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {Math.round((priorityCounts.low / totalTickets) * 100) || 0}% of total
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg">
                  <span className="font-medium mb-2">Medium</span>
                  <span className="text-2xl font-bold">{priorityCounts.medium || 0}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {Math.round((priorityCounts.medium / totalTickets) * 100) || 0}% of total
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg">
                  <span className="font-medium mb-2">High</span>
                  <span className="text-2xl font-bold">{priorityCounts.high || 0}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {Math.round((priorityCounts.high / totalTickets) * 100) || 0}% of total
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg">
                  <span className="font-medium mb-2">Critical</span>
                  <span className="text-2xl font-bold">{priorityCounts.critical || 0}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {Math.round((priorityCounts.critical / totalTickets) * 100) || 0}% of total
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assignees">
              <div className="space-y-4">
                {topAssignees.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topAssignees.map((assignee: any) => (
                      <div key={assignee.id} className="flex items-center gap-3 p-3 border rounded-md">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{assignee.username}</p>
                          <p className="text-sm text-muted-foreground">{assignee.ticketCount} tickets assigned</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{assignee.resolvedCount} resolved</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round((assignee.resolvedCount / assignee.ticketCount) * 100) || 0}% resolution rate
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">No assignee data available</div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Recent Tickets</h3>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Last 7 days
              </Badge>
            </div>
            <div className="space-y-2">
              {recentTickets && recentTickets.length > 0 ? (
                recentTickets.map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                    <div>
                      <a href={`/tickets/${ticket.id}`} className="font-medium hover:underline">
                        {ticket.title}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        By {ticket.createdBy?.username || "Unknown"} • {new Date(ticket.createdAt).toLocaleDateString()}
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
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">No recent tickets found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

