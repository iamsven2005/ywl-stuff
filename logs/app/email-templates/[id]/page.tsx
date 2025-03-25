import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEmailTemplate } from "@/app/actions/email-template-actions"
import { ArrowLeft, Edit } from "lucide-react"
import { DatabaseStatusBar } from "@/components/database-status-bar"

export const metadata: Metadata = {
  title: "Email Template Details",
  description: "View email template details",
}

export default async function EmailTemplateDetailPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)

  // Get the email template
  const emailTemplate = await getEmailTemplate(id).catch(() => null)

  if (!emailTemplate) {
    notFound()
  }

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return date.toLocaleString()
  }

  return (
    <div className="container mx-auto py-6">
      <DatabaseStatusBar />

      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/logs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{emailTemplate.name}</h1>
          <p className="text-muted-foreground">Email template details</p>
        </div>
        <Button asChild>
          <Link href={`/email-templates/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Template
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Basic information about this template</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Subject</dt>
                <dd className="mt-1 text-sm">{emailTemplate.subject}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd className="mt-1 text-sm">{formatDate(emailTemplate.createdAt)}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                <dd className="mt-1 text-sm">{formatDate(emailTemplate.updatedAt)}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">Assigned Users</dt>
                <dd className="mt-1 text-sm">
                    Id:
                  {emailTemplate.assignedUsers && emailTemplate.assignedUsers.length > 0
                    ? emailTemplate.assignedUsers.map((user) => user.userId).join(", ")
                    : "None"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
            <CardDescription>How the email will appear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="mb-4 pb-2 border-b">
                <div className="text-sm text-gray-600">From: {process.env.FROM_EMAIL || "system@example.com"}</div>
                <div className="text-sm text-gray-600">To: [Recipient]</div>
                <div className="text-sm text-gray-600">Subject: {emailTemplate.subject}</div>
              </div>
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: emailTemplate.body.replace(/\n/g, "<br/>") }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

