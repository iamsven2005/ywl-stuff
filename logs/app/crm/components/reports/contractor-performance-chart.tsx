"use client"

import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartRadar,
  ChartRadarChart,
  ChartPolarGrid,
  ChartPolarRadiusAxis,
  ChartTooltip,
  ChartLegend,
} from "@/components/ui/chart"

export default function ContractorPerformanceChart({ contractors }) {
  // Filter contractors with ratings
  const contractorsWithRating = contractors
    .filter((contractor) => contractor.rating)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5) // Top 5 contractors by rating

  // Generate random performance metrics for demonstration
  const data = [
    { subject: "Quality", fullMark: 100 },
    { subject: "Timeliness", fullMark: 100 },
    { subject: "Cost Efficiency", fullMark: 100 },
    { subject: "Communication", fullMark: 100 },
    { subject: "Safety", fullMark: 100 },
  ]

  // Add contractor data to each metric
  contractorsWithRating.forEach((contractor) => {
    data.forEach((metric) => {
      // Convert 0-5 rating to 0-100 for quality, randomize others between 60-100
      if (metric.subject === "Quality") {
        metric[contractor.name] = Math.round(contractor.rating * 20)
      } else {
        metric[contractor.name] = Math.round(Math.random() * 40 + 60)
      }
    })
  })

  return (
    <Card className="w-full p-4">
      <ChartContainer className="h-[300px]">
        <ChartRadarChart data={data}>
          <ChartPolarGrid />
          <ChartPolarRadiusAxis />
          {contractorsWithRating.map((contractor, index) => {
            const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"]
            return (
              <ChartRadar
                key={contractor.id}
                name={contractor.name.length > 15 ? contractor.name.substring(0, 15) + "..." : contractor.name}
                dataKey={contractor.name}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.2}
              />
            )
          })}
          <ChartLegend />
          <ChartTooltip />
        </ChartRadarChart>
      </ChartContainer>
    </Card>
  )
}
