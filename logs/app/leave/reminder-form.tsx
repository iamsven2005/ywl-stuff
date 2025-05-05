"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { addReminder, updateReminder } from "@/app/leave/reminder-actions"
import { toast } from "../hooks/use-toast"

const reminderFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  description: z.string().optional(),
  color: z.string().optional(),
})

type ReminderFormValues = z.infer<typeof reminderFormSchema>

interface ReminderFormProps {
  onSuccess?: () => void
  defaultDate?: Date
  reminderId?: number
  defaultValues?: {
    title: string
    date: Date
    description?: string
    color?: string
  }
  mode?: "add" | "edit"
}

const REMINDER_COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#a855f7", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
]

export function ReminderForm({ onSuccess, defaultDate, reminderId, defaultValues, mode = "add" }: ReminderFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: defaultValues || {
      title: "",
      date: defaultDate || new Date(),
      description: "",
      color: "#6366f1", // Default indigo color
    },
  })

  // Update form values when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues && mode === "edit") {
      form.reset(defaultValues)
    }
  }, [defaultValues, form, mode])

  async function onSubmit(data: ReminderFormValues) {
    setIsSubmitting(true)
    try {
      if (mode === "edit" && reminderId) {
        const result = await updateReminder(reminderId, data)
        if (result.success) {
          toast({
            title: "Reminder updated",
            description: "Your personal reminder has been updated successfully.",
          })
        } else {
          throw new Error(result.error)
        }
      } else {
        await addReminder(data)
        toast({
          title: "Reminder added",
          description: "Your personal reminder has been added to the calendar.",
        })
        form.reset()
      }

      router.refresh()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${mode === "edit" ? "update" : "add"} reminder. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Team Meeting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add details for this reminder" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <div className="flex flex-wrap gap-2">
                {REMINDER_COLORS.map((color) => (
                  <div
                    key={color.value}
                    className={cn(
                      "h-8 w-8 cursor-pointer rounded-full border-2",
                      field.value === color.value ? "border-black dark:border-white" : "border-transparent",
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => form.setValue("color", color.value)}
                    title={color.label}
                  />
                ))}
              </div>
              <FormDescription>Choose a color for your reminder</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "edit"
              ? "Updating..."
              : "Adding..."
            : mode === "edit"
              ? "Update Reminder"
              : "Add Reminder"}
        </Button>
      </form>
    </Form>
  )
}
