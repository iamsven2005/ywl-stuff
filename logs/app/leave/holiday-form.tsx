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
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { addHoliday, updateHoliday } from "@/app/leave/holiday-actions"
import { toast } from "../hooks/use-toast"

const holidayFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
})

type HolidayFormValues = z.infer<typeof holidayFormSchema>

interface HolidayFormProps {
  onSuccess?: () => void
  holidayId?: number
  defaultValues?: {
    name: string
    date: Date
    description?: string
    isRecurring: boolean
  }
  mode?: "add" | "edit"
}

export function HolidayForm({ onSuccess, holidayId, defaultValues, mode = "add" }: HolidayFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: defaultValues || {
      name: "",
      date: new Date(),
      description: "",
      isRecurring: false,
    },
  })

  // Update form values when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues && mode === "edit") {
      form.reset(defaultValues)
    }
  }, [defaultValues, form, mode])

  async function onSubmit(data: HolidayFormValues) {
    setIsSubmitting(true)
    try {
      if (mode === "edit" && holidayId) {
        await updateHoliday(holidayId, data)
        toast({
          title: "Holiday updated",
          description: "The holiday has been updated successfully.",
        })
      } else {
        await addHoliday(data)
        toast({
          title: "Holiday added",
          description: "The holiday has been added to the calendar.",
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
        description: `Failed to ${mode === "edit" ? "update" : "add"} holiday. Please try again.`,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Holiday Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Christmas Day" {...field} />
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
                <Textarea placeholder="Add a description for this holiday" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Annual Holiday</FormLabel>
                <FormDescription>This holiday repeats every year on the same date</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "edit"
              ? "Updating..."
              : "Adding..."
            : mode === "edit"
              ? "Update Holiday"
              : "Add Holiday"}
        </Button>
      </form>
    </Form>
  )
}
