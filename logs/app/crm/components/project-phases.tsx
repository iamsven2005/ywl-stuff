import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/lib/utils"
import { Pencil, Plus } from "lucide-react"

export default function ProjectPhases({ project }) {
  const phases = project.bridgeProject?.phases || []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Phases</CardTitle>
            <CardDescription>Current progress of construction phases</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/crm/projects/${project.id}/phases/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Phase
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {phases.length > 0 ? (
          <div className="space-y-4">
            {phases.map((phase) => (
              <div key={phase.id} className="rounded-md border p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium">{phase.name}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">{phase.completionPercentage}%</div>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <Link href={`/crm/projects/${project.id}/phases/${phase.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                  </div>
                </div>
                <Progress value={phase.completionPercentage} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        phase.status === "NOT_STARTED"
                          ? "bg-gray-100 text-gray-800"
                          : phase.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : phase.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : phase.status === "DELAYED"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                      }`}
                    >
                      {phase.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span>Start: {formatDate(phase.startDate) || "Not set"}</span>
                    <span>End: {formatDate(phase.endDate) || "Not set"}</span>
                  </div>
                </div>
                {phase.description && <div className="mt-2 text-sm">{phase.description}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No phases defined for this project</p>
            <Button className="mt-4" asChild>
              <Link href={`/crm/projects/${project.id}/phases/new`}>Add Phase</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
