"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createAlertCondition, updateAlertCondition } from "@/app/actions/alert-actions"
import { AlertCircle, Download, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the type for email templates
export interface EmailTemplate {
  id: number
  name: string
  subject: string
  body: string
  createdAt: Date
  updatedAt: Date
}

// Define the type for alert condition data
export interface AlertConditionData {
  id: number
  name: string
  sourceTable: string
  fieldName: string
  comparator: string
  thresholdValue: string
  timeWindowMin: number | null
  countThreshold: number | null
  repeatIntervalMin: number | null
  active: boolean
  emailTemplateId: number | null
  lastTriggeredAt: Date | null
}

// Define props for the component
export interface AlertConditionFormProps {
  emailTemplates: EmailTemplate[]
  initialData?: AlertConditionData
  isEditing?: boolean
}

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sourceTable: z.string().min(1, "Source table is required"),
  fieldName: z.string().min(1, "Field name is required"),
  comparator: z.string().min(1, "Comparator is required"),
  thresholdValue: z.string().min(1, "Threshold value is required"),
  timeWindowMin: z.coerce.number().int().nullable(),
  countThreshold: z.coerce.number().int().nullable(),
  repeatIntervalMin: z.coerce.number().int().nullable(),
  active: z.boolean().default(true),
  emailTemplateId: z.coerce.number().nullable(),
})

// Define available fields based on source table
const getAvailableFields = (table: string) => {
  switch (table) {
    case "system_metrics":
      return [
        { value: "cpu_usage", label: "CPU Usage (%)" },
        { value: "mem_usage", label: "Memory Usage (%)" },
        { value: "disk_usage", label: "Disk Usage (%)" },
        { value: "load_avg", label: "Load Average" },
        { value: "process_count", label: "Process Count" },
      ]
    case "auth":
      return [
        { value: "action", label: "Action" },
        { value: "command", label: "Command" },
        { value: "ipAddress", label: "IP Address" },
        { value: "piuser", label: "User" },
      ]
    case "logs":
      return [
        { value: "action", label: "Action" },
        { value: "command", label: "Command" },
        { value: "cpu", label: "CPU Usage" },
        { value: "mem", label: "Memory Usage" },
        { value: "pid", label: "Process ID" },
      ]
      case "UserActivity":
        return [
          { value: "action", label: "Action" },
          { value: "command", label: "Details" },
        ]
    default:
      return []
  }
}

// Check if a field is text-based
const isTextBasedField = (table: string, field: string) => {
  return (
    (table === "auth" && ["action", "command", "ipAddress", "piuser"].includes(field)) ||
    (table === "logs" && ["action", "command"].includes(field)) ||
    (table === "UserActivity" && ["action", "command"].includes(field))
  )
}

// Define available comparators based on field type
const getAvailableComparators = (table: string, field: string) => {
  // Text-based fields
  if (isTextBasedField(table, field)) {
    return [
      { value: "contains", label: "Contains" },
      { value: "not_contains", label: "Does Not Contain" },
      { value: "equals", label: "Equals" },
    ]
  }

  // Numeric fields
  return [
    { value: ">", label: "Greater Than (>)" },
    { value: ">=", label: "Greater Than or Equal (>=)" },
    { value: "<", label: "Less Than (<)" },
    { value: "<=", label: "Less Than or Equal (<=)" },
    { value: "==", label: "Equal (==)" },
    { value: "!=", label: "Not Equal (!=)" },
  ]
}

export function AlertConditionForm({ emailTemplates, initialData, isEditing = false }: AlertConditionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTextBasedCondition, setIsTextBasedCondition] = useState(
    initialData ? isTextBasedField(initialData.sourceTable, initialData.fieldName) : false,
  )
  const [importFile, setImportFile] = useState<File | null>(null)

  // Initialize form with default values or initial data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      sourceTable: initialData?.sourceTable || "system_metrics",
      fieldName: initialData?.fieldName || "",
      comparator: initialData?.comparator || "",
      thresholdValue: initialData?.thresholdValue || "",
      timeWindowMin: initialData?.timeWindowMin || null,
      countThreshold: initialData?.countThreshold || null,
      repeatIntervalMin: initialData?.repeatIntervalMin || null,
      active: initialData?.active ?? true,
      emailTemplateId: initialData?.emailTemplateId || null,
    },
  })
  const fieldName = form.watch("fieldName");
  const sourceTable = form.watch("sourceTable");


  // Update available comparators when field name changes
  useEffect(() => {
    const currentTable = form.getValues("sourceTable")
    const currentField = form.getValues("fieldName")

    if (currentField) {
      // Reset comparator when field name changes
      form.setValue("comparator", "")

      // Check if we need to update the isTextBasedCondition state
      setIsTextBasedCondition(isTextBasedField(currentTable, currentField))
    }
  }, [form.watch("fieldName")])

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      setError(null)

      if (isEditing && initialData) {
        // Update existing alert condition
        await updateAlertCondition(initialData.id, values)
        toast.success("Alert condition updated successfully")
      } else {
        // Create new alert condition
        await createAlertCondition(values)
        toast.success("Alert condition created successfully")
      }

      // Redirect to alert conditions list
      router.push("/alerts")
      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("An error occurred while saving the alert condition. Please try again.")
      toast.error("Failed to save alert condition")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Export alert conditions to Excel
  const exportToExcel = async () => {
    try {
      // Get the current form values
      const values = form.getValues()

      // Create a simple object for Excel export
      const data = [
        {
          name: values.name,
          sourceTable: values.sourceTable,
          fieldName: values.fieldName,
          comparator: values.comparator,
          thresholdValue: values.thresholdValue,
          timeWindowMin: values.timeWindowMin,
          countThreshold: values.countThreshold,
          repeatIntervalMin: values.repeatIntervalMin,
          active: values.active ? "Yes" : "No",
          emailTemplateId: values.emailTemplateId,
        },
      ]

      // Convert to CSV format
      const headers = Object.keys(data[0]).join(",")
      const rows = data.map((row) => Object.values(row).join(","))
      const csv = [headers, ...rows].join("\n")

      // Create a blob and download link
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `alert_condition_${values.name.replace(/\s+/g, "_")}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Alert condition exported successfully")
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast.error("Failed to export alert condition")
    }
  }

  // Import alert conditions from Excel
  const importFromExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setImportFile(file)

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string
          const lines = csv.split("\n")
          const headers = lines[0].split(",")
          const values = lines[1].split(",")

          // Create an object from the CSV data
          const data: Record<string, any> = {}
          headers.forEach((header, index) => {
            data[header] = values[index]
          })

          // Update form values
          form.setValue("name", data.name || "")
          form.setValue("sourceTable", data.sourceTable || "system_metrics")
          form.setValue("fieldName", data.fieldName || "")
          form.setValue("comparator", data.comparator || "")
          form.setValue("thresholdValue", data.thresholdValue || "")
          form.setValue("timeWindowMin", data.timeWindowMin ? Number.parseInt(data.timeWindowMin) : null)
          form.setValue("countThreshold", data.countThreshold ? Number.parseInt(data.countThreshold) : null)
          form.setValue("repeatIntervalMin", data.repeatIntervalMin ? Number.parseInt(data.repeatIntervalMin) : null)
          form.setValue("active", data.active === "Yes")
          form.setValue("emailTemplateId", data.emailTemplateId ? Number.parseInt(data.emailTemplateId) : null)

          // Update state based on imported data
          setIsTextBasedCondition(isTextBasedField(data.sourceTable, data.fieldName))

          toast.success("Alert condition imported successfully")
        } catch (error) {
          console.error("Error parsing CSV:", error)
          toast.error("Failed to parse CSV file")
        }
      }

      reader.readAsText(file)
    } catch (error) {
      console.error("Error importing from Excel:", error)
      toast.error("Failed to import alert condition")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end space-x-4">
          <div className="flex items-center space-x-2">
            <Button type="button" variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("import-file")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <input id="import-file" type="file" accept=".csv" className="hidden" onChange={importFromExcel} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Name</FormLabel>
                <FormControl>
                  <Input placeholder="High CPU Usage Alert" {...field} />
                </FormControl>
                <FormDescription>A descriptive name for this alert condition</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>Enable or disable this alert condition</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="sourceTable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Table</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    // Reset field name and comparator when source table changes
                    form.setValue("fieldName", "")
                    form.setValue("comparator", "")
                    form.setValue("thresholdValue", "")
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source table" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="system_metrics">System Metrics</SelectItem>
                    <SelectItem value="auth">Auth Logs</SelectItem>
                    <SelectItem value="logs">System Logs</SelectItem>
                    <SelectItem value="UserActivity">User Activity</SelectItem>

                  </SelectContent>
                </Select>
                <FormDescription>The data source to monitor</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fieldName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Name</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    // Reset comparator when field name changes
                    form.setValue("comparator", "")
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getAvailableFields(sourceTable).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>The specific field to monitor</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="comparator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comparator</FormLabel>
                <Select
  onValueChange={field.onChange}
  defaultValue={field.value}
  disabled={!fieldName}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select comparator" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getAvailableComparators(form.getValues("sourceTable"), form.getValues("fieldName")).map(
                      (option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>How to compare the field value</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="thresholdValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isTextBasedCondition ? "Text Value" : "Threshold Value"}</FormLabel>
              <FormControl>
                {isTextBasedCondition ? (
                  <Textarea placeholder={isTextBasedCondition ? "cd /etc/" : "90"} {...field} />
                ) : (
                  <Input type="text" placeholder="90" {...field} />
                )}
              </FormControl>
              <FormDescription>
                {isTextBasedCondition
                  ? "The text to search for in the logs"
                  : "The threshold value to trigger the alert"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="timeWindowMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Window (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="5"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number.parseInt(e.target.value, 10)
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormDescription>Time period to evaluate (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="countThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Count Threshold</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="3"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number.parseInt(e.target.value, 10)
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormDescription>Number of occurrences to trigger (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="repeatIntervalMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repeat Interval (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="60"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number.parseInt(e.target.value, 10)
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormDescription>Minimum time between alerts (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="emailTemplateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Template</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "null" ? null : Number.parseInt(value, 10))}
                defaultValue={field.value === null ? "null" : field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select email template" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">None</SelectItem>
                  {emailTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Email template to use for notifications (optional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/alerts")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Alert Condition" : "Create Alert Condition"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

