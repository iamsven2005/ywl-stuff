import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { HardHat, Building2, FileText, Calendar, Clock, ArrowLeft, Download, Edit } from "lucide-react"
import { getProject } from "@/app/crm/actions/projects"
import { notFound } from "next/navigation"
import { formatDate, formatCurrency } from "@/lib/utils"
import ProjectCompanies from "@/app/crm/components/project-companies"
import ProjectMaterials from "@/app/crm/components/project-materials"
import ProjectInteractions from "@/app/crm/components/project-interactions"
import ProjectInspections from "@/app/crm/components/project-inspections"

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = Number.parseInt(params.id)
  const { project, error } = await getProject(projectId)

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-2">
            <HardHat className="h-6 w-6" />
            <h1 className="text-lg font-semibold">BridgeCRM</h1>
          </div>
          <nav className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">Projects</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/companies">Companies</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contacts">Contacts</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports">Reports</Link>
            </Button>
          </nav>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Project Details</h1>
          </div>

          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-500">Error loading project</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button className="mt-6" asChild>
              <Link href="/projects">Return to Projects</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    notFound()
  }

  // Calculate completion percentage based on phases
  let completionPercentage = 0
  if (project.bridgeProject?.phases?.length > 0) {
    const totalPhases = project.bridgeProject.phases.length
    const completedPhases = project.bridgeProject.phases.filter((phase) => phase.status === "COMPLETED").length
    const inProgressPhases = project.bridgeProject.phases.filter((phase) => phase.status === "IN_PROGRESS")

    const completedPercentage = (completedPhases / totalPhases) * 100
    const inProgressPercentage = inProgressPhases.reduce(
      (acc, phase) => acc + phase.completionPercentage / totalPhases,
      0,
    )

    completionPercentage = Math.round(completedPercentage + inProgressPercentage)
  }

  // Extract materials from the project for the ProjectMaterials component
  const materials = project.bridgeProject?.materials || []

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <HardHat className="h-6 w-6" />
          <h1 className="text-lg font-semibold">BridgeCRM</h1>
        </div>
        <nav className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">Projects</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/companies">Companies</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contacts">Contacts</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports">Reports</Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="ml-auto flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild>
              <Link href={`/projects/${project.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.status || "N/A"}</div>
              <div className="mt-2">
                <Progress value={completionPercentage} className="h-2" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{completionPercentage}% completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.startDate && project.estimatedEndDate
                  ? `${Math.ceil((new Date(project.estimatedEndDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Start: {formatDate(project.startDate)}</p>
              <p className="text-xs text-muted-foreground">End: {formatDate(project.estimatedEndDate)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(project.budget)}</div>
              <p className="text-xs text-muted-foreground">
                {/* In a real app, you would calculate spent amount from contracts and orders */}
                Tracking in progress
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.companies?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {project.companies?.length > 0
                  ? `${project.companies.filter((c) => c.role.includes("Contractor")).length} contractors, 
                   ${project.companies.filter((c) => !c.role.includes("Contractor")).length} vendors`
                  : "No companies assigned"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Bridge Details</CardTitle>
              <CardDescription>Technical specifications for this bridge project</CardDescription>
            </CardHeader>
            <CardContent>
              {project.bridgeProject ? (
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-muted-foreground">Bridge Type</dt>
                    <dd>{project.bridgeProject.bridgeType}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Span Length</dt>
                    <dd>{project.bridgeProject.spanLength ? `${project.bridgeProject.spanLength} meters` : "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Width</dt>
                    <dd>{project.bridgeProject.width ? `${project.bridgeProject.width} meters` : "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Height</dt>
                    <dd>{project.bridgeProject.height ? `${project.bridgeProject.height} meters` : "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Load Capacity</dt>
                    <dd>{project.bridgeProject.loadCapacity ? `${project.bridgeProject.loadCapacity} tons` : "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Waterway</dt>
                    <dd>{project.bridgeProject.waterway || "N/A"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-medium text-muted-foreground">Environmental Considerations</dt>
                    <dd>{project.bridgeProject.environmentalConsiderations || "N/A"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-medium text-muted-foreground">Traffic Impact</dt>
                    <dd>{project.bridgeProject.trafficImpact || "N/A"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-muted-foreground">No bridge details available</p>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Project Phases</CardTitle>
              <CardDescription>Current progress of construction phases</CardDescription>
            </CardHeader>
            <CardContent>
              {project.bridgeProject?.phases?.length > 0 ? (
                <div className="space-y-4">
                  {project.bridgeProject.phases.map((phase) => (
                    <div key={phase.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium">{phase.name}</div>
                        <div className="text-sm text-muted-foreground">{phase.completionPercentage}%</div>
                      </div>
                      <Progress value={phase.completionPercentage} className="h-2" />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <div>{phase.status}</div>
                        <div>{phase.endDate ? formatDate(phase.endDate) : "No end date"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No phases defined for this project</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/projects/${project.id}/phases/new`}>Add Phase</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="companies">
          <TabsList>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
          </TabsList>
          <TabsContent value="companies" className="border-none p-0 pt-4">
            <ProjectCompanies project={project} />
          </TabsContent>
          <TabsContent value="materials" className="border-none p-0 pt-4">
            <ProjectMaterials projectId={project.id} materials={materials} />
          </TabsContent>
          <TabsContent value="interactions" className="border-none p-0 pt-4">
            <ProjectInteractions project={project} />
          </TabsContent>
          <TabsContent value="inspections" className="border-none p-0 pt-4">
            <ProjectInspections project={project} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
