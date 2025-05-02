"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { submitLeaveApplication } from "@/app/leave/actions"
import { toast } from "../hooks/use-toast"

const leaveFormSchema = z
  .object({
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z
      .date({
        required_error: "End date is required",
      })
      .refine((date) => date >= new Date(), {
        message: "End date cannot be in the past",
      }),
    leaveType: z.enum(["FULL_DAY", "AM", "PM"], {
      required_error: "Please select a leave type",
    }),
    reason: z.string().min(5, {
      message: "Reason must be at least 5 characters",
    }),
    approverId: z.number({
      required_error: "Please select an approver",
    }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })

type LeaveFormValues = z.infer<typeof leaveFormSchema>

// This would come from your API in a real application
const APPROVERS = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Alex Johnson" },
]

export function LeaveApplicationForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(),
      leaveType: "FULL_DAY",
      reason: "",
    },
  })

  async function onSubmit(data: LeaveFormValues) {
    setIsSubmitting(true)
    try {
      await submitLeaveApplication(data)
      toast({
        title: "Leave application submitted",
        description: "Your leave application has been submitted for approval.",
      })
      form.reset()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit leave application. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
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
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="leaveType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FULL_DAY">Full Day</SelectItem>
                    <SelectItem value="AM">Morning (AM)</SelectItem>
                    <SelectItem value="PM">Afternoon (PM)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Select whether you need a full day or half day leave</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="approverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approver</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number.parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an approver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {APPROVERS.map((approver) => (
                      <SelectItem key={approver.id} value={approver.id.toString()}>
                        {approver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select the person who will approve your leave request</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Leave</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please provide a reason for your leave request"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Briefly explain why you are requesting leave</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Leave Application"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
