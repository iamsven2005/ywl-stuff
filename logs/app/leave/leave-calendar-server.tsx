import { getApprovedLeaves } from "@/app/leave/actions"
import { LeaveCalendarClient } from "./leave-calendar-client"

export async function LeaveCalendar() {
  // Fetch approved leaves from the database
  const approvedLeaves = await getApprovedLeaves()

  // Transform the data for the client component
  const formattedLeaves = approvedLeaves.map((leave) => ({
    id: leave.id,
    userId: leave.userId,
    userName: leave.user.username || leave.user.email || `User ${leave.userId}`,
    startDate: leave.startDate,
    endDate: leave.endDate,
    leaveType: leave.leaveType,
    status: leave.status,
  }))

  return <LeaveCalendarClient leaves={formattedLeaves} />
}
