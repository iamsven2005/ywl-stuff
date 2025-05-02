"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const scheduledReportSchema = z.object({
  name: z.string().min(2, { message: "Report name must be at least 2 characters." }),
  description: z.string().optional(),
  reportTemplate: z.string(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  dayOfWeek: z.string().optional(),
  dayOfMonth: z.coerce.number().min(1).max(31).optional(),
  recipients: z.array(z.string()).min(1, { message: "Select at least one recipient" }),
  emailSubject: z.string().min(2, { message: "Email subject must be at least 2 characters." }),
  emailBody: z.string().optional(),
  fileFormat: z.enum(["pdf", "excel", "csv"]),
})

const reportTemplates = [
  { id: "project_progress", name: "Project Progress Report" },
  { id: "contractor_performance", name: "Contractor Performance Evaluation" },
  { id: "budget_variance", name: "Budget Variance Analysis" },
  { id: "material_usage", name: "Material Usage and Cost Report" },
  { id: "inspection_summary", name: "Inspection Summary Report" },
]

export default function ScheduledReportForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(scheduledReportSchema),
    defaultValues: {
      name: "",
      description: "",
      reportTemplate: "",
      frequency: "weekly",
      dayOfWeek: "monday",
      dayOfMonth: 1,
      recipients: [],
      emailSubject: "",
      emailBody: "",
      fileFormat: "pdf",
    },
  })

  // Watch frequency to conditionally show day of week or day of month
  const frequency = form.watch("frequency")

  // Fetch recipients (users/contacts) on component mount
  useEffect(() => {
    async function fetchRecipients() {
      setLoading(true)
      try {
        // In a real app, this would fetch from an API
        setRecipients([
          { id: "user1", name: "John Smith", email: "john@example.com" },
          { id: "user2", name: "Jane Doe", email: "jane@example.com" },
          { id: "user3", name: "Robert Johnson", email: "robert@example.com" },
          { id: "user4", name: "Emily Davis", email: "emily@example.com" },
        ])
      } catch (error) {
        console.error("Error fetching recipients:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipients()
  }, [])

  async function onSubmit(data) {
    setIsSubmitting(true)

    try {
      // In a real app, this would save to the database
      console.log("Scheduled report configuration:", data)

      // Navigate back to reports page
      router.push("/crm/reports")
    } catch (error) {
      console.error("Error submitting form:", error)
      form.setError("root", { message: "An unexpected error occurred" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter schedule name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reportTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Report Template*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {reportTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter schedule description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Schedule Configuration</h3>

          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {frequency === "weekly" && (
            <FormField
              control={form.control}
              name="dayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of Week*</FormLabel>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-4"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="monday" />
                      </FormControl>
                      <FormLabel className="font-normal">Monday</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="tuesday" />
                      </FormControl>
                      <FormLabel className="font-normal">Tuesday</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="wednesday" />
                      </FormControl>
                      <FormLabel className="font-normal">Wednesday</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="thursday" />
                      </FormControl>
                      <FormLabel className="font-normal">Thursday</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="friday" />
                      </FormControl>
                      <FormLabel className="font-normal">Friday</FormLabel>
                    </FormItem>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(frequency === "monthly" || frequency === "quarterly") && (
            <FormField
              control={form.control}
              name="dayOfMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of Month*</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="31" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Delivery Configuration</h3>

          <FormField
            control={form.control}
            name="recipients"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Recipients*</FormLabel>
                  <FormDescription>Select who should receive this report</FormDescription>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {recipients.map((recipient) => (
                    <FormField
                      key={recipient.id}
                      control={form.control}
                      name="recipients"
                      render={({ field }) => {
                        return (
                          <FormItem key={recipient.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(recipient.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, recipient.id])
                                    : field.onChange(field.value?.filter((value) => value !== recipient.id))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {recipient.name} ({recipient.email})
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailSubject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Subject*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email subject" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailBody"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Body</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter email body text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fileFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Format*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select file format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && <div className="text-red-500 text-sm">{form.formState.errors.root.message}</div>}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || loading}>
            {isSubmitting ? "Scheduling..." : "Schedule Report"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
