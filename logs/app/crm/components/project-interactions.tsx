import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

export default function ProjectInteractions({ project }) {
  const interactions = project.interactions || []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Interactions</CardTitle>
            <CardDescription>Recent communications related to this project</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/crm/projects/${project.id}/interactions/new`}>
              <Users className="mr-2 h-4 w-4" />
              New Interaction
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {interactions.length > 0 ? (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="flex items-start gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{interaction.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(interaction.interactionDate)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{interaction.notes || "No notes provided"}</div>
                  <div className="flex items-center gap-2 pt-2">
                    {interaction.contact && (
                      <span className="text-xs text-muted-foreground">Contact: {interaction.contact.name}</span>
                    )}
                    {interaction.company && (
                      <span className="text-xs text-muted-foreground">
                        Company:{" "}
                        <Link href={`/crm/companies/${interaction.company.id}`} className="hover:underline">
                          {interaction.company.name}
                        </Link>
                      </span>
                    )}
                    {interaction.outcome && (
                      <span className="text-xs text-muted-foreground">Outcome: {interaction.outcome}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No interactions recorded for this project</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
