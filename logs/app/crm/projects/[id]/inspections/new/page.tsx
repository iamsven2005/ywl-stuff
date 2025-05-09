import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import { getProject } from "@/app/crm/actions/projects"
import { notFound } from "next/navigation"
import InspectionForm from "@/app/crm/components/inspection-form"

export default async function NewInspectionPage({ params }: { params: { id: string } }) {
  const projectId = Number.parseInt(params.id)
  const { project, error } = await getProject(projectId)

  if (error || !project) {
    notFound()
  }

  // Check if the project has any phases
  if (!project.bridgeProject?.phases || project.bridgeProject.phases.length === 0) {
    return (
     
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/crm/projects/${project.id}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Add New Inspection</h1>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">This project has no phases to inspect.</p>
                <p className="text-muted-foreground mt-2">Please add phases to the project first.</p>
                <Button className="mt-4" asChild>
                  <Link href={`/crm/projects/${project.id}/phases/new`}>Add Phase</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
    )
  }

  return (
    
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/crm/projects/${project.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Add New Inspection</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inspection Information</CardTitle>
            <CardDescription>Record a quality control inspection for {project.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <InspectionForm project={project} />
          </CardContent>
        </Card>
      </main>
  )
}
