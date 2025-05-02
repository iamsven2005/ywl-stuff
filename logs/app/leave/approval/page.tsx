import { LeaveApprovalDashboard } from "../leave-approval-dashboard-server"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Leave Approval",
  description: "Approve or reject leave applications",
}

export default function LeaveApprovalPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Leave Approval Dashboard</h1>
      <LeaveApprovalDashboard />
    </div>
  )
}
