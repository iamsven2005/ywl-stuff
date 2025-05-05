import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Building2, Calendar, CheckCircle, Clock, FileText, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getInteraction } from "./actions"

export default async function InteractionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const id = Number.parseInt(params.id)
  if (isNaN(id)) {
    return notFound()
  }

  const { interaction, error } = await getInteraction(id)

  if (error || !interaction) {
    return notFound()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Interaction Details</h1>
        <Button asChild variant="outline">
          <Link href="/crm/interactions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Interactions
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{interaction.title}</CardTitle>
            <Badge>{interaction.interactionType}</Badge>
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            {format(new Date(interaction.interactionDate), "PPP")}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {interaction.company && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Company</div>
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Link href={`/crm/companies/${interaction.companyId}`} className="text-primary hover:underline">
                      {interaction.company.name}
                    </Link>
                  </div>
                </div>
              )}

              {interaction.contact && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Contact</div>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Link href={`/crm/contacts/${interaction.contactId}`} className="text-primary hover:underline">
                      {interaction.contact.firstName} {interaction.contact.lastName}
                    </Link>
                  </div>
                </div>
              )}

              {interaction.project && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Project</div>
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Link href={`/crm/projects/${interaction.projectId}`} className="text-primary hover:underline">
                      {interaction.project.name}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {interaction.outcome && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Outcome</div>
                  <div className="bg-muted p-3 rounded-md">{interaction.outcome}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Follow-up Required</div>
                <div className="flex items-center">
                  <CheckCircle
                    className={`mr-2 h-4 w-4 ${interaction.followUpRequired ? "text-green-500" : "text-muted-foreground"}`}
                  />
                  {interaction.followUpRequired ? "Yes" : "No"}
                </div>
              </div>

              {interaction.followUpRequired && interaction.followUpDate && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Follow-up Date</div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    {format(new Date(interaction.followUpDate), "PPP")}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {interaction.notes && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Notes</div>
              <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">{interaction.notes}</div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href={`/crm/interactions/${interaction.id}/edit`}>Edit Interaction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
