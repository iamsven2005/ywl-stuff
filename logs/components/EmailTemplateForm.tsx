"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  assignUsersToEmailTemplate,
  createEmailTemplate,
  removeUsersFromEmailTemplate,
  updateEmailTemplate,
} from "@/app/actions/email-template-actions"
import { MultiSelect } from "./multi-select"
import { getUsers } from "@/app/actions/user-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  subject: z.string().min(2, "Subject must be at least 2 characters."),
  body: z.string().min(10, "Body must be at least 10 characters."),
  assignedUsers: z.array(z.string()).optional(),
})

interface User {
  id: number
  username: string
}

interface EmailTemplateFormProps {
  template?: {
    id: number
    name: string
    subject: string
    body: string
    assignedUsers: User[]
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function EmailTemplateForm({ template, onSuccess, onCancel }: EmailTemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [previewHtml, setPreviewHtml] = useState("")

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { users } = await getUsers({ page: 1, pageSize: 50 }) // Provide default values
        setUsers(users)
      } catch (error) {
        toast.error("Failed to load users.")
      }
    }
    fetchUsers()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || "",
      subject: template?.subject || "",
      body: template?.body || "",
      assignedUsers: template ? template.assignedUsers.map((u) => String(u.id)) : [],
    },
  })

  // Update preview when body changes
  useEffect(() => {
    const body = form.watch("body")
    if (body) {
      // Replace placeholders with sample values for preview
      const previewBody = body
        .replace(/{{username}}/g, "John Doe")
        .replace(/{{email}}/g, "john.doe@example.com")
        .replace(/{{command}}/g, "sudo rm -rf /")
        .replace(/{{logEntry}}/g, "2023-03-15 14:30:45 - User executed: sudo rm -rf /")
        .replace(/{{ruleName}}/g, "Dangerous Command")
        .replace(/{{groupName}}/g, "System Security")
        .replace(/{{timestamp}}/g, new Date().toLocaleString())

      // Convert newlines to <br> tags for HTML display
      setPreviewHtml(previewBody.replace(/\n/g, "<br>"))
    }
  }, [form.watch("body")])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      if (template) {
        await updateEmailTemplate({ id: template.id, ...values })

        const newUserIds = values.assignedUsers?.map(Number) || []
        const oldUserIds = template.assignedUsers.map((u) => u.id)

        const usersToAdd = newUserIds.filter((id) => !oldUserIds.includes(id))
        const usersToRemove = oldUserIds.filter((id) => !newUserIds.includes(id))

        if (usersToAdd.length) await assignUsersToEmailTemplate(template.id, usersToAdd)
        if (usersToRemove.length) await removeUsersFromEmailTemplate(template.id, usersToRemove)

        toast.success("Email template updated successfully.")
      } else {
        const userIds = values.assignedUsers?.map(Number) || []
        const { emailTemplate } = await createEmailTemplate({ ...values, assignedUsers: userIds })

        if (values.assignedUsers && values.assignedUsers.length > 0) {
          await assignUsersToEmailTemplate(emailTemplate.id, values.assignedUsers.map(Number))
        }

        toast.success("Email template created successfully.")
      }

      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Failed to save email template.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Tabs defaultValue="edit">
      <TabsList className="mb-4">
        <TabsTrigger value="edit">Edit Template</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="edit">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., High CPU Alert" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Alert: High CPU Usage Detected" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Body</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dear {{username}}, We detected high CPU usage on {{device}} at {{timestamp}}..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <div className="space-y-1 text-xs text-muted-foreground mt-2">
                    <p>Available placeholders:</p>
                    <p>
                      <code>{"{{username}}"}</code> - User's name
                    </p>
                    <p>
                      <code>{"{{email}}"}</code> - User's email
                    </p>
                    <p>
                      <code>{"{{command}}"}</code> - Matched command
                    </p>
                    <p>
                      <code>{"{{logEntry}}"}</code> - Full log entry
                    </p>
                    <p>
                      <code>{"{{ruleName}}"}</code> - Rule name
                    </p>
                    <p>
                      <code>{"{{groupName}}"}</code> - Rule group name
                    </p>
                    <p>
                      <code>{"{{timestamp}}"}</code> - Time of match
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Users</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={users.map((user) => ({ label: user.username, value: String(user.id) }))}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select users..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : template ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="preview">
        <Card>
          <CardHeader>
            <CardTitle>{form.watch("subject") || "Email Subject Preview"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="p-4 border rounded-md bg-white text-black"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

