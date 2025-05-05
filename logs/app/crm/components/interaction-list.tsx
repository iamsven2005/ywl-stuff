import Link from "next/link"
import { format } from "date-fns"
import { Building2, Calendar, Clock, FileText, User } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Interaction = {
  id: number
  title: string
  notes?: string | null
  interactionType: string
  interactionDate: Date
  outcome?: string | null
  followUpRequired: boolean
  followUpDate?: Date | null
  contactId?: number | null
  companyId?: number | null
  projectId?: number | null
  contact?: {
    id: number
    firstName: string
    lastName: string
  } | null
  company?: {
    id: number
    name: string
  } | null
  project?: {
    id: number
    name: string
  } | null
}

interface InteractionListProps {
  interactions: Interaction[]
  showViewAll?: boolean
  limit?: number
}

export function InteractionList({ interactions, showViewAll = false, limit }: InteractionListProps) {
  const displayedInteractions = limit ? interactions.slice(0, limit) : interactions

  return (
    <div className="space-y-4">
      {displayedInteractions.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">No interactions found.</CardContent>
        </Card>
      ) : (
        displayedInteractions.map((interaction) => (
          <Link
            href={`/crm/interactions/${interaction.id}`}
            key={interaction.id}
            className="block transition-all hover:shadow-md"
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{interaction.title}</CardTitle>
                  <Badge>{interaction.interactionType}</Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {format(new Date(interaction.interactionDate), "PPP")}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {interaction.company && (
                    <div className="flex items-center">
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{interaction.company.name}</span>
                    </div>
                  )}

                  {interaction.contact && (
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {interaction.contact.firstName} {interaction.contact.lastName}
                      </span>
                    </div>
                  )}

                  {interaction.project && (
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{interaction.project.name}</span>
                    </div>
                  )}
                </div>

                {interaction.followUpRequired && interaction.followUpDate && (
                  <div className="mt-4 flex items-center text-sm text-amber-600">
                    <Clock className="mr-2 h-4 w-4" />
                    Follow-up on {format(new Date(interaction.followUpDate), "PPP")}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))
      )}

      {showViewAll && interactions.length > 0 && (
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/interactions">View All Interactions</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export default InteractionList
