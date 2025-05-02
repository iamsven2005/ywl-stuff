import { LeaveCalendar } from "./leave-calendar-server"
import { LeaveApplicationForm } from "./leave-application-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Leave Management",
  description: "Apply for leave and view leave calendar",
}

export default function LeavePage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Leave Management</h1>

      <Tabs defaultValue="apply" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="apply">Apply for Leave</TabsTrigger>
          <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="apply" className="mt-6">
          <LeaveApplicationForm />
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <LeaveCalendar />
        </TabsContent>
      </Tabs>
    </div>
  )
}
