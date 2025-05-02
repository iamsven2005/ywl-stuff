import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, Building2, FileText, TrendingUp } from "lucide-react"

interface DashboardStatsProps {
  activeProjects: number
  contractors: number
  upcomingInspections: number
  openBids: number
}

export default function DashboardStats({
  activeProjects,
  contractors,
  upcomingInspections,
  openBids,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <HardHat className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <p className="text-xs text-muted-foreground">Ongoing bridge construction projects</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contractors</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{contractors}</div>
          <p className="text-xs text-muted-foreground">Registered contractors and subcontractors</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Inspections</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingInspections}</div>
          <p className="text-xs text-muted-foreground">Scheduled in the next 30 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Bids</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openBids}</div>
          <p className="text-xs text-muted-foreground">Awaiting review and decision</p>
        </CardContent>
      </Card>
    </div>
  )
}
