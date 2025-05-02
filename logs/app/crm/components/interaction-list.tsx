import { CalendarDays, Users } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import Link from "next/link"

export default function InteractionList({ interactions }) {
  if (!interactions || interactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No interactions found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {interactions.map((interaction) => (
        <div key={interaction.id} className="flex items-start gap-4 rounded-lg border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {interaction.interactionType.includes("Meeting") ? (
              <Users className="h-5 w-5 text-primary" />
            ) : (
              <CalendarDays className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold">{interaction.title}</div>
              <div className="text-xs text-muted-foreground">{formatRelativeTime(interaction.interactionDate)}</div>
            </div>
            <div className="text-sm text-muted-foreground">{interaction.notes || "No notes provided"}</div>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {interaction.project && (
                <span className="text-xs text-muted-foreground">
                  Project:{" "}
                  <Link href={`/crm/projects/${interaction.project.id}`} className="hover:underline">
                    {interaction.project.name}
                  </Link>
                </span>
              )}
              {interaction.company && (
                <span className="text-xs text-muted-foreground">
                  Company:{" "}
                  <Link href={`/crm/companies/${interaction.company.id}`} className="hover:underline">
                    {interaction.company.name}
                  </Link>
                </span>
              )}
              {interaction.contact && (
                <span className="text-xs text-muted-foreground">Contact: {interaction.contact.name}</span>
              )}
              {interaction.outcome && (
                <span className="text-xs text-muted-foreground">Outcome: {interaction.outcome}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
