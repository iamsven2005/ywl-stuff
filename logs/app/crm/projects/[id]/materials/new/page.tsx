import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import { getProject } from "@/app/crm/actions/projects"
import MaterialForm from "@/app/crm/components/material-form"

export default async function NewMaterialPage({ params }: { params: { id: string } }) {
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
          <h1 className="text-2xl font-bold">Add Material to Project</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Material Details</CardTitle>
            <CardDescription>Add a new material to project: {project.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <MaterialForm projectId={projectId} />
          </CardContent>
        </Card>
      </main>
  )
}
