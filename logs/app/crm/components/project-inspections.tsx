import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

export default function ProjectInspections({ project }) {
  // Flatten inspections from all phases
  const inspections =
    project.bridgeProject?.phases
      ?.flatMap((phase) =>
        phase.inspections.map((inspection) => ({
          ...inspection,
          phaseName: phase.name,
        })),
      )
      .sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime()) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspections</CardTitle>
        <CardDescription>Quality control inspections for this project</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {inspections.length > 0 ? (
          <div className="border rounded-md">
            <div className="grid grid-cols-5 p-4 font-medium border-b">
              <div>Phase</div>
              <div>Date</div>
              <div>Inspector</div>
              <div>Result</div>
              <div>Notes</div>
            </div>
            <div className="divide-y">
              {inspections.map((inspection) => (
                <div key={inspection.id} className="grid grid-cols-5 p-4 hover:bg-muted/50">
                  <div className="font-medium">{inspection.phaseName}</div>
                  <div>{formatDate(inspection.inspectionDate)}</div>
                  <div>{inspection.inspector}</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        inspection.result === "PASS"
                          ? "bg-green-100 text-green-800"
                          : inspection.result === "FAIL"
                            ? "bg-red-100 text-red-800"
                            : inspection.result === "CONDITIONAL PASS"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {inspection.result}
                    </span>
                  </div>
                  <div>{inspection.notes || "No notes"}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No inspections recorded for this project</p>
            {project.bridgeProject?.phases?.length > 0 ? (
              <Button className="mt-4" asChild>
                <Link href={`/crm/projects/${project.id}/inspections/new`}>Add Inspection</Link>
              </Button>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Add project phases before recording inspections</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
