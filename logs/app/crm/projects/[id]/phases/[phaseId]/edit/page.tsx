import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"

import { notFound } from "next/navigation"
import PhaseForm from "@/app/crm/components/phase-form"
import { getProject } from "@/app/crm/actions/projects"
import { getPhase } from "@/app/crm/actions/phases"

export default async function EditPhasePage({ params }: { params: { id: string; phaseId: string } }) {
  const projectId = Number.parseInt(params.id)
  const phaseId = Number.parseInt(params.phaseId)

  const { project, error: projectError } = await getProject(projectId)
  const { phase, error: phaseError } = await getPhase(phaseId)

  if (projectError || !project || phaseError || !phase) {
    notFound()
  }

  // Verify that the phase belongs to the project
  if (phase.bridgeProjectId !== project.bridgeProject.id) {
    notFound()
  }

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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/crm/projects/${project.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Phase</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Phase Information</CardTitle>
            <CardDescription>Edit phase details for {project.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <PhaseForm project={project} phase={phase} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
