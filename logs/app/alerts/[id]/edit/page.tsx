import { notFound, redirect } from "next/navigation"
import { AlertConditionForm } from "../../new/alert-condition-form"
import { getAlertCondition } from "@/app/actions/alert-actions"
import { getAllEmailTemplates } from "@/app/actions/email-template-actions"
import { DatabaseStatusBar } from "@/components/database-status-bar"
import { getCurrentUser } from "@/app/login/actions"
import { checkUserPermission } from "@/app/actions/permission-actions"


export default async function EditAlertConditionPage({
  params,
}: {
  params: { id: string }
}) {
  if (!params?.id || isNaN(Number(params.id))) {
    notFound()
  }
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
    return
  }
  const perm = await checkUserPermission(currentUser.id, "/alerts")
  if (perm.hasPermission === false) {
    return notFound()
  }
  const id = Number.parseInt(params.id, 10)

  const alertCondition = await getAlertCondition(id).catch(() => null)
  if (!alertCondition) {
    notFound()
  }

  const emailTemplates = await getAllEmailTemplates()

  const formattedTemplates = emailTemplates?.map((template) => ({
    id: template.id,
    name: template.name,
    createdAt: new Date(template.createdAt),
    updatedAt: new Date(template.updatedAt),
    subject: template.subject,
    body: template.body,
  })) || []

  return (
    <div className="container mx-auto py-6">
      <DatabaseStatusBar />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Alert Condition</h1>
        <p className="text-muted-foreground">Update the settings for this alert condition</p>
      </div>
      <div className="rounded-md border p-6">
        <AlertConditionForm
          emailTemplates={formattedTemplates}
          initialData={alertCondition}
          isEditing={true}
        />
      </div>
    </div>
  )
}

