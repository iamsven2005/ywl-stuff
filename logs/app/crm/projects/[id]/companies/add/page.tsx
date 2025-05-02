import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import { getProject } from "@/app/crm/actions/projects"
import { getCompanies } from "@/app/crm/actions/companies"
import ProjectCompanyForm from "@/app/crm/components/project-company-form"

export default async function AddCompanyToProjectPage({ params }: { params: { id: string } }) {
  const projectId = Number.parseInt(params.id)
  const { project, error: projectError } = await getProject(projectId)
  const { companies, error: companiesError } = await getCompanies()

  if (projectError || !project) {
    return notFound()
  }

  // Filter out companies that are already associated with the project
  const availableCompanies =
    companies?.filter((company) => !project.companies?.some((pc) => pc.company.id === company.id)) || []

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
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Add Company to Project</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project: {project.name}</CardTitle>
            <CardDescription>Add a company to this project and define their role and contract details</CardDescription>
          </CardHeader>
          <CardContent>
            {availableCompanies.length > 0 ? (
              <ProjectCompanyForm projectId={projectId} companies={availableCompanies} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  All companies are already associated with this project or no companies exist.
                </p>
                <div className="mt-4 flex justify-center gap-4">
                  <Button asChild>
                    <Link href="/crm/companies/new">Create New Company</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/projects/${projectId}`}>Back to Project</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
