import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AlertConditionForm } from "../../new/alert-condition-form"
import { getAlertCondition } from "@/app/actions/alert-actions"
import { getAllEmailTemplates } from "@/app/actions/email-template-actions"
import { DatabaseStatusBar } from "@/components/database-status-bar"

export const metadata: Metadata = {
  title: "Edit Alert Condition",
  description: "Edit an existing alert condition",
}

export default async function EditAlertConditionPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)

  // Get the alert condition
  const alertCondition = await getAlertCondition(id).catch(() => null)

  if (!alertCondition) {
    notFound()
  }

  // Get all email templates for the dropdown
  const emailTemplates = await getAllEmailTemplates()

  // Map the email templates to the expected format
  const formattedTemplates = emailTemplates
    ? emailTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        // Convert string dates to Date objects
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt),
        subject: template.subject,
        body: template.body,
      }))
    : []

  return (
    <div className="container mx-auto py-6">
      <DatabaseStatusBar />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Alert Condition</h1>
        <p className="text-muted-foreground">Update the settings for this alert condition</p>
      </div>

      <div className="rounded-md border p-6">
        <AlertConditionForm emailTemplates={formattedTemplates} initialData={alertCondition} isEditing={true} />
      </div>
    </div>
  )
}

