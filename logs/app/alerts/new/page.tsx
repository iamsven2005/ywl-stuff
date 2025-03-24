import type { Metadata } from "next"
import { AlertConditionForm } from "./alert-condition-form"
import { getAllEmailTemplates } from "@/app/actions/email-template-actions"
import { DatabaseStatusBar } from "@/components/database-status-bar"

export const metadata: Metadata = {
  title: "Create Alert Condition",
  description: "Create a new alert condition",
}

export default async function NewAlertConditionPage() {
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
        <h1 className="text-3xl font-bold">Create Alert Condition</h1>
        <p className="text-muted-foreground">Set up a new alert condition to monitor your system</p>
      </div>

      <div className="rounded-md border p-6">
        <AlertConditionForm emailTemplates={formattedTemplates} />
      </div>
    </div>
  )
}

