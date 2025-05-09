import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { HardHat, Search, Plus, Filter } from "lucide-react"
import { getProjects } from "../actions/projects"
import ProjectListSkeleton from "@/app/crm/components/skeletons/project-list-skeleton"

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string }
}) {
  const { status, search } = searchParams
  const { projects, error } = await getProjects()
  
  const filteredProjects = projects?.filter((p) => {
    const matchesStatus = status && status !== "all" ? p.status === status : true
    const matchesSearch = search
      ? p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase())
      : true
    return matchesStatus && matchesSearch
  })
  
  // Define project statuses for filter links
  const projectStatuses = [
    { value: "all", label: "All Statuses" },
    { value: "PLANNING", label: "Planning" },
    { value: "BIDDING", label: "Bidding" },
    { value: "DESIGN", label: "Design" },
    { value: "PERMITTING", label: "Permitting" },
    { value: "CONSTRUCTION", label: "Construction" },
    { value: "INSPECTION", label: "Inspection" },
    { value: "COMPLETED", label: "Completed" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "CANCELLED", label: "Cancelled" },
  ]

  return (

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Button asChild>
            <Link href="/crm/projects/new">
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
        <form className="relative flex-1" method="get">
  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
  <Input
    type="search"
    name="search"
    defaultValue={search || ""}
    placeholder="Search projects..."
    className="w-full pl-8"
  />
</form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {status ? `${status.charAt(0) + status.slice(1).toLowerCase()} Projects` : "All Projects"}
            </CardTitle>
            <CardDescription>
              {status
                ? `Manage all projects currently in ${status.toLowerCase()} stage.`
                : "Manage all your bridge construction projects."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <ProjectListSkeleton />
            ) : (
              <div className="border rounded-md">
                <div className="grid grid-cols-6 p-4 font-medium border-b">
                  <div>Project Name</div>
                  <div>Bridge Type</div>
                  <div>Location</div>
                  <div>Status</div>
                  <div>Timeline</div>
                  <div>Actions</div>
                </div>
                <div className="divide-y">
                  {filteredProjects && filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <div key={project.id} className="grid grid-cols-6 p-4 hover:bg-muted/50">
                        <div className="font-medium">
                          <Link href={`/crm/projects/${project.id}`} className="hover:underline">
                            {project.name}
                          </Link>
                        </div>
                        <div>{project.bridgeProject?.bridgeType || "N/A"}</div>
                        <div>{project.location || "N/A"}</div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              project.status === "PLANNING"
                                ? "bg-purple-100 text-purple-800"
                                : project.status === "BIDDING"
                                  ? "bg-blue-100 text-blue-800"
                                  : project.status === "DESIGN"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : project.status === "PERMITTING"
                                      ? "bg-cyan-100 text-cyan-800"
                                      : project.status === "CONSTRUCTION"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : project.status === "INSPECTION"
                                          ? "bg-orange-100 text-orange-800"
                                          : project.status === "COMPLETED"
                                            ? "bg-green-100 text-green-800"
                                            : project.status === "ON_HOLD"
                                              ? "bg-gray-100 text-gray-800"
                                              : project.status === "CANCELLED"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {project.status || "UNKNOWN"}
                          </span>
                        </div>
                        <div>
                          {project.startDate && project.estimatedEndDate
                            ? `${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.estimatedEndDate).toLocaleDateString()}`
                            : "N/A"}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/crm/projects/${project.id}`}>View</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/crm/projects/${project.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No projects found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
  )
}
