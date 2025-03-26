"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getEmailTemplate } from "@/app/actions/email-template-actions"
import { ArrowLeft, Edit, Eye } from "lucide-react"
import { DatabaseStatusBar } from "@/components/database-status-bar"
import { EmailTemplateForm } from "@/components/email-template-form"

export default function EmailTemplateDetailPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10)
  const router = useRouter()
  const [emailTemplate, setEmailTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"view" | "edit">("view")

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString
    return date.toLocaleString()
  }

  useEffect(() => {
    async function loadEmailTemplate() {
      try {
        setLoading(true)
        const template = await getEmailTemplate(id)
        if (!template) {
          setError("Email template not found")
          return
        }
        setEmailTemplate(template)
      } catch (err) {
        setError("Failed to load email template")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadEmailTemplate()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <DatabaseStatusBar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading email template...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !emailTemplate) {
    return (
      <div className="container mx-auto py-6">
        <DatabaseStatusBar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500">{error || "Email template not found"}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/email-templates">Back to Email Templates</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleEditSuccess = () => {
    setMode("view")
    router.refresh() // Refresh the page data
  }

  return (
    <div className="container mx-auto py-6">
      <DatabaseStatusBar />

      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/alerts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Alerts
          </Link>
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{emailTemplate.name}</h1>
          <p className="text-muted-foreground">Email template details</p>
        </div>
        <Button
          onClick={() => setMode(mode === "view" ? "edit" : "view")}
          variant={mode === "view" ? "default" : "outline"}
        >
          {mode === "view" ? (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Edit Template
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              View Template
            </>
          )}
        </Button>
      </div>

      {mode === "view" ? (
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
                    {emailTemplate.assignedUsers && emailTemplate.assignedUsers.length > 0
                      ? emailTemplate.assignedUsers.map((user: any) => user.userId).join(", ")
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Edit Email Template</CardTitle>
            <CardDescription>Make changes to your email template</CardDescription>
          </CardHeader>
          <CardContent>
            <EmailTemplateForm
              template={{
                id: emailTemplate.id,
                name: emailTemplate.name,
                subject: emailTemplate.subject,
                body: emailTemplate.body,
                assignedUsers:
                  emailTemplate.assignedUsers?.map((user: any) => ({
                    id: user.userId,
                    username: user.userId.toString(), // We don't have the username here, but the form will fetch users
                  })) || [],
              }}
              onSuccess={handleEditSuccess}
              onCancel={() => setMode("view")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

