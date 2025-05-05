import { getApprovedLeaves } from "@/app/leave/actions"
import { getHolidays } from "@/app/leave/holiday-actions"
import { getUserReminders } from "@/app/leave/reminder-actions"
import { LeaveCalendarClient } from "./leave-calendar-client"
import { getCurrentUser } from "@/app/login/actions"

export async function LeaveCalendar() {
  // Get current user
  const currentUser = await getCurrentUser()

  // Fetch approved leaves from the database
  const approvedLeaves = await getApprovedLeaves()

  // Fetch holidays from the database
  const holidays = await getHolidays()

  // Fetch user's personal reminders
  const reminders = currentUser ? await getUserReminders() : []

  // Transform the leave data for the client component
  const formattedLeaves = approvedLeaves.map((leave) => ({
    id: leave.id,
    userId: leave.userId,
    userName: leave.user.username || leave.user.email || `User ${leave.userId}`,
    startDate: leave.startDate,
    endDate: leave.endDate,
    leaveType: leave.leaveType,
    status: leave.status,
  }))

  // Transform the holiday data for the client component
  const formattedHolidays = holidays.map((holiday) => ({
    id: holiday.id,
    name: holiday.name,
    date: holiday.date,
    description: holiday.description || "",
    isRecurring: holiday.isRecurring,
  }))

  // Transform the reminder data for the client component
  const formattedReminders = reminders.map((reminder) => ({
    id: reminder.id,
    title: reminder.title,
    date: reminder.date,
    description: reminder.description || "",
    color: reminder.color || "#6366f1",
  }))

  return (
    <LeaveCalendarClient
      leaves={formattedLeaves}
      holidays={formattedHolidays}
      reminders={formattedReminders}
      currentUserId={currentUser?.id}
    />
  )
}
