import Link from "next/link"

export default function ProjectList({ projects }) {
  if (!projects || projects.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No projects found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <div className="grid grid-cols-5 p-4 font-medium border-b">
        <div>Project Name</div>
        <div>Bridge Type</div>
        <div>Location</div>
        <div>Status</div>
        <div>Completion</div>
      </div>
      <div className="divide-y">
        {projects.map((project) => {
          // Calculate completion percentage based on phases if available
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

          return (
            <div key={project.id} className="grid grid-cols-5 p-4 hover:bg-muted/50">
              <div className="font-medium">
                <Link href={`/crm/projects/${project.id}`} className="hover:underline">
                  {project.name}
                </Link>
              </div>
              <div>{project.bridgeProject?.bridgeType || "N/A"}</div>
              <div>{project.location || "N/A"}</div>
              <div>
                <ProjectStatusBadge status={project.status} />
              </div>
              <div>{completionPercentage}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProjectStatusBadge({ status }) {
  const statusStyles = {
    PLANNING: "bg-purple-100 text-purple-800",
    BIDDING: "bg-blue-100 text-blue-800",
    DESIGN: "bg-indigo-100 text-indigo-800",
    PERMITTING: "bg-cyan-100 text-cyan-800",
    CONSTRUCTION: "bg-yellow-100 text-yellow-800",
    INSPECTION: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
    ON_HOLD: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status || "UNKNOWN"}
    </span>
  )
}
