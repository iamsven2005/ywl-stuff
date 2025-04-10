import type { Metadata } from "next"

import { db } from "@/lib/db"
import { subDays, startOfDay, endOfDay, format } from "date-fns"
import UserActivityChart from "../charts/user-activity-chart"
import UserActivityTable from "../tables/user-activity-table"
import { getCurrentUser } from "../login/actions"
import { notFound, redirect } from "next/navigation"
import { checkUserPermission } from "../actions/permission-actions"

export const metadata: Metadata = {
  title: "User Activity",
  description: "View and export user activity logs",
}

async function getUserActivityData(page = 1, pageSize = 10) {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          redirect("/login")
        }
        const perm = await checkUserPermission(currentUser.id, "/online")
        if (perm.hasPermission === false) {
          return notFound()
        }
  const skip = (page - 1) * pageSize

  const activities = await db.userActivity.findMany({
    take: pageSize,
    skip,
    orderBy: {
      loginTime: "desc",
    },
  })

  const totalCount = await db.userActivity.count()

  return {
    activities,
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
  }
}

async function getActivityChartData(days = 30) {
  const startDate = startOfDay(subDays(new Date(), days))

  // Get activity counts grouped by day
  const activityByDay = await db.userActivity.groupBy({
    by: ["page"],
    _count: {
      id: true,
    },
    where: {
      loginTime: {
        gte: startDate,
      },
    },
    orderBy: {
      page: "asc",
    },
  })

  // Get daily counts for the chart
  const dailyActivity = []

  for (let i = 0; i < days; i++) {
    const date = subDays(new Date(), i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)

    const count = await db.userActivity.count({
      where: {
        loginTime: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    })

    dailyActivity.push({
      date: format(date, "MMM dd"),
      count,
      timestamp: date.getTime(),
    })
  }

  // Sort by date ascending
  dailyActivity.sort((a, b) => a.timestamp - b.timestamp)

  // Get page distribution
  const pageDistribution = activityByDay.map((item) => ({
    page: item.page,
    count: item._count.id,
  }))

  return {
    dailyActivity,
    pageDistribution,
  }
}

export default async function UserActivityPage({
  searchParams,
}: {
  searchParams: { page?: string; days?: string }
}) {
  const currentPage = Number(searchParams.page) || 1
  const days = Number(searchParams.days) || 30
  const pageSize = 10

  const { activities, totalPages, totalCount } = await getUserActivityData(currentPage, pageSize)
  const chartData = await getActivityChartData(days)

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">User Activity Logs</h1>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Activity Over Time</h2>
        <UserActivityChart
          dailyActivity={chartData.dailyActivity}
          pageDistribution={chartData.pageDistribution}
          days={days}
        />
      </div>

      <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>
      <UserActivityTable
        initialData={activities}
        totalPages={totalPages}
        currentPage={currentPage}
        totalCount={totalCount}
      />
    </div>
  )
}
