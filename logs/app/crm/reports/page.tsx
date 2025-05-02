import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HardHat, FileText, Calendar, PlusCircle } from "lucide-react"
import { getProjects } from "../actions/projects"
import { getCompanies } from "../actions/companies"
import ProjectStatusChart from "../components/reports/project-status-chart"
import BudgetAnalysisChart from "../components/reports/budget-analysis-chart"
import ContractorPerformanceChart from "../components/reports/contractor-performance-chart"
import MaterialCostChart from "../components/reports/material-cost-chart"
import ExportReportButton from "../components/reports/export-report-button"

export default async function ReportsPage() {
  const { projects } = await getProjects()
  const { companies } = await getCompanies({ type: "CONTRACTOR" })

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <HardHat className="h-6 w-6" />
          <h1 className="text-lg font-semibold">BridgeCRM</h1>
        </div>
        <nav className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/projects">Projects</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/companies">Companies</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/contacts">Contacts</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/reports">Reports</Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/crm/reports/schedule">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Report
              </Link>
            </Button>
            <Button asChild>
              <Link href="/crm/reports/custom">
                <PlusCircle className="mr-2 h-4 w-4" />
                Custom Report
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">Project Status</TabsTrigger>
            <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
            <TabsTrigger value="contractors">Contractor Performance</TabsTrigger>
            <TabsTrigger value="materials">Material Costs</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="border-none p-0 pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Project Status Overview</CardTitle>
                  <CardDescription>Distribution of projects by current status</CardDescription>
                </div>
                <ExportReportButton reportId="project-status" reportName="Project Status Report" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <ProjectStatusChart projects={projects || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="border-none p-0 pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Budget Analysis</CardTitle>
                  <CardDescription>Budget allocation and spending across projects</CardDescription>
                </div>
                <ExportReportButton reportId="budget-analysis" reportName="Budget Analysis Report" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <BudgetAnalysisChart projects={projects || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contractors" className="border-none p-0 pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contractor Performance</CardTitle>
                  <CardDescription>Performance metrics for top contractors</CardDescription>
                </div>
                <ExportReportButton reportId="contractor-performance" reportName="Contractor Performance Report" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <ContractorPerformanceChart contractors={companies || []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="border-none p-0 pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Material Cost Analysis</CardTitle>
                  <CardDescription>Cost breakdown by material type</CardDescription>
                </div>
                <ExportReportButton reportId="material-cost" reportName="Material Cost Report" />
              </CardHeader>
              <CardContent className="h-[400px]">
                <MaterialCostChart projects={projects || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Report Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="text-sm">
                  <Link href="/crm/reports/custom?template=project_progress" className="text-blue-600 hover:underline">
                    Monthly Project Progress Report
                  </Link>
                </li>
                <li className="text-sm">
                  <Link
                    href="/crm/reports/custom?template=contractor_performance"
                    className="text-blue-600 hover:underline"
                  >
                    Contractor Performance Evaluation
                  </Link>
                </li>
                <li className="text-sm">
                  <Link href="/crm/reports/custom?template=budget_variance" className="text-blue-600 hover:underline">
                    Budget Variance Analysis
                  </Link>
                </li>
                <li className="text-sm">
                  <Link href="/crm/reports/custom?template=material_usage" className="text-blue-600 hover:underline">
                    Material Usage and Cost Report
                  </Link>
                </li>
                <li className="text-sm">
                  <Link href="/crm/reports/custom?template=inspection_summary" className="text-blue-600 hover:underline">
                    Inspection Summary Report
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Reports</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="text-sm flex justify-between">
                  <span>Weekly Progress Summary</span>
                  <span className="text-muted-foreground">Every Monday</span>
                </li>
                <li className="text-sm flex justify-between">
                  <span>Monthly Budget Report</span>
                  <span className="text-muted-foreground">1st of month</span>
                </li>
                <li className="text-sm flex justify-between">
                  <span>Quarterly Performance Review</span>
                  <span className="text-muted-foreground">End of quarter</span>
                </li>
              </ul>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link href="/crm/reports/schedule">Manage Scheduled Reports</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create custom reports with specific metrics and filters for your bridge projects.
              </p>
              <Button className="w-full" asChild>
                <Link href="/crm/reports/custom">Create Custom Report</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
