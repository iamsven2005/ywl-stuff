import { getPendingLeaves } from "@/app/leave/actions"
import { LeaveApprovalDashboardClient } from "./leave-approval-dashboard-client"

export async function LeaveApprovalDashboard() {
  // Fetch pending leaves from the database
  const pendingLeaves = await getPendingLeaves()

  // Transform the data for the client component
  const formattedLeaves = pendingLeaves.map((leave) => ({
    id: leave.id,
    userId: leave.userId,
    userName: leave.user.username || leave.user.email || `User ${leave.userId}`,
    startDate: leave.startDate,
    endDate: leave.endDate,
    leaveType: leave.leaveType,
    reason: leave.reason,
    status: leave.status,
    createdAt: leave.createdAt,
  }))

  return <LeaveApprovalDashboardClient pendingLeaves={formattedLeaves} />
}
