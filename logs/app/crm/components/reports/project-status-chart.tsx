"use client"

import { Card } from "@/components/ui/card"
import { ChartContainer, ChartPie, ChartPieChart, ChartTooltip, ChartLegend } from "@/components/ui/chart"

export default function ProjectStatusChart({ projects }) {
  // Count projects by status
  const statusCounts = projects.reduce((acc, project) => {
    const status = project.status || "UNKNOWN"
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  // Convert to array format for chart
  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }))

  // Define colors for different statuses
  const COLORS = {
    PLANNING: "#8884d8",
    BIDDING: "#82ca9d",
    DESIGN: "#ffc658",
    PERMITTING: "#ff8042",
    CONSTRUCTION: "#0088fe",
    INSPECTION: "#00c49f",
    COMPLETED: "#4caf50",
    ON_HOLD: "#ff9800",
    CANCELLED: "#f44336",
    UNKNOWN: "#9e9e9e",
  }

  return (
    <Card className="w-full p-4">
      <ChartContainer className="h-[300px]">
        <ChartPieChart>
          <ChartPie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <ChartPie key={`cell-${index}`} fill={COLORS[entry.name] || "#8884d8"} data={[entry]} dataKey="value" />
            ))}
          </ChartPie>
          <ChartTooltip />
          <ChartLegend />
        </ChartPieChart>
      </ChartContainer>
    </Card>
  )
}
