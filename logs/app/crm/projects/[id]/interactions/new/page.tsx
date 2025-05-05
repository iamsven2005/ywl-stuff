import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import { getProject } from "@/app/crm/actions/projects"
import InteractionForm from "@/app/crm/components/interaction-form"

export default async function NewProjectInteractionPage({ params }: { params: { id: string } }) {
  const projectId = Number.parseInt(params.id)
  const { project, error } = await getProject(projectId)

  if (error || !project) {
    return notFound()
  }

  return (

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/crm/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">New Interaction</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Record Project Interaction</CardTitle>
            <CardDescription>Record a new interaction related to project: {project.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <InteractionForm projectId={projectId} projectCompanies={project.companies || []} />
          </CardContent>
        </Card>
      </main>
  )
}
