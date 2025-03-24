"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createAlertCondition, updateAlertCondition } from "@/app/actions/alert-actions"

// Define the form schema
const alertConditionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sourceTable: z.string().min(1, "Source table is required"),
  fieldName: z.string().min(1, "Field name is required"),
  comparator: z.string().min(1, "Comparator is required"),
  thresholdValue: z.string().min(1, "Threshold value is required"),
  timeWindowMin: z.coerce.number().int().positive().optional().nullable(),
  repeatIntervalMin: z.coerce.number().int().positive().optional().nullable(),
  countThreshold: z.coerce.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
  emailTemplateId: z.coerce.number().optional().nullable(),
})

type AlertConditionFormValues = z.infer<typeof alertConditionSchema>

// Define the available source tables and their fields
const sourceTables = [
  {
    value: "system_metrics",
    label: "System Metrics",
    fields: [
      { value: "cpu_temp", label: "CPU Temperature" },
      { value: "cpu_usage", label: "CPU Usage" },
      { value: "memory_usage", label: "Memory Usage" },
      { value: "disk_usage", label: "Disk Usage" },
    ],
    comparators: [
      { value: ">", label: "Greater Than" },
      { value: ">=", label: "Greater Than or Equal" },
      { value: "<", label: "Less Than" },
      { value: "<=", label: "Less Than or Equal" },
      { value: "==", label: "Equal To" },
      { value: "!=", label: "Not Equal To" },
    ],
  },
  {
    value: "auth",
    label: "Auth Logs",
    fields: [
      { value: "log_entry", label: "Log Entry" },
      { value: "username", label: "Username" },
    ],
    comparators: [
      { value: "contains", label: "Contains" },
      { value: "not_contains", label: "Does Not Contain" },
      { value: "equals", label: "Equals" },
    ],
  },
  {
    value: "logs",
    label: "System Logs",
    fields: [
      { value: "command", label: "Command" },
      { value: "name", label: "Name" },
      { value: "cpu", label: "CPU Usage" },
      { value: "mem", label: "Memory Usage" },
    ],
    comparators: [
      { value: "contains", label: "Contains" },
      { value: "not_contains", label: "Does Not Contain" },
      { value: "equals", label: "Equals" },
      { value: ">", label: "Greater Than" },
      { value: ">=", label: "Greater Than or Equal" },
      { value: "<", label: "Less Than" },
      { value: "<=", label: "Less Than or Equal" },
    ],
  },
]

interface EmailTemplate {
  id: number
  name: string
  subject?: string
  body?: string
  createdAt?: Date
  updatedAt?: Date
}

interface AlertConditionFormProps {
  emailTemplates: EmailTemplate[]
  initialData?: any
  isEditing?: boolean
}

export function AlertConditionForm({ emailTemplates, initialData, isEditing = false }: AlertConditionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSourceTable, setSelectedSourceTable] = useState(initialData?.sourceTable || "")

  // Get the available fields and comparators for the selected source table
  const selectedTableConfig = sourceTables.find((table) => table.value === selectedSourceTable)
  const availableFields = selectedTableConfig?.fields || []
  const availableComparators = selectedTableConfig?.comparators || []

  // Initialize the form with default values or existing data
  const form = useForm<AlertConditionFormValues>({
    resolver: zodResolver(alertConditionSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          emailTemplateId: initialData.emailTemplateId?.toString() || null,
        }
      : {
          name: "",
          sourceTable: "",
          fieldName: "",
          comparator: "",
          thresholdValue: "",
          timeWindowMin: 5,
          repeatIntervalMin: null,
          countThreshold: null,
          active: true,
          emailTemplateId: null,
        },
  })

  // Handle form submission
  async function onSubmit(values: AlertConditionFormValues) {
    setIsSubmitting(true)
    try {
      if (isEditing && initialData) {
        // Update existing alert condition
        const result = await updateAlertCondition(initialData.id, values)
        if (result.success) {
          toast.success("Alert condition updated successfully")
          router.push("/alerts")
          router.refresh()
        }
      } else {
        // Create new alert condition
        const result = await createAlertCondition(values)
        if (result.success) {
          toast.success("Alert condition created successfully")
          router.push("/alerts")
          router.refresh()
        }
      }
    } catch (error) {
      toast.error(`Failed to ${isEditing ? "update" : "create"} alert condition`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Name</FormLabel>
                <FormControl>
                  <Input placeholder="High CPU Temperature" {...field} />
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="sourceTable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source Table</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    setSelectedSourceTable(value)
                    // Reset field name and comparator when source table changes
                    form.setValue("fieldName", "")
                    form.setValue("comparator", "")
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source table" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sourceTables.map((table) => (
                      <SelectItem key={table.value} value={table.value}>
                        {table.label}
                      </SelectItem>
                    ))}
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedSourceTable}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableFields.map((fieldOption) => (
                      <SelectItem key={fieldOption.value} value={fieldOption.value}>
                        {fieldOption.label}
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedSourceTable}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select comparator" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableComparators.map((comparator) => (
                      <SelectItem key={comparator.value} value={comparator.value}>
                        {comparator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>How to compare the field value</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="thresholdValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Threshold Value</FormLabel>
                <FormControl>
                  <Input placeholder="90" {...field} />
                </FormControl>
                <FormDescription>The value to compare against</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeWindowMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Window (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="5"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number.parseInt(e.target.value, 10)
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormDescription>Period to check for the condition</FormDescription>
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
                    min="1"
                    placeholder="Optional"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number.parseInt(e.target.value, 10)
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormDescription>Number of occurrences to trigger alert</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="repeatIntervalMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repeat Interval (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Optional"
                    {...field}
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number.parseInt(e.target.value, 10)
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormDescription>How often to re-alert if condition persists</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailTemplateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Template</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? null : Number.parseInt(value, 10))}
                  defaultValue={field.value?.toString() || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Email template to use for notifications</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>
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

