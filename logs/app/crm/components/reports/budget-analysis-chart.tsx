"use client"

import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartBar,
  ChartBarChart,
  ChartGrid,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

export default function BudgetAnalysisChart({ projects }) {
  // Filter projects with budget
  const projectsWithBudget = projects
    .filter((project) => project.budget)
    .sort((a, b) => Number(b.budget) - Number(a.budget))
    .slice(0, 10) // Top 10 projects by budget

  // Prepare data for chart
  const data = projectsWithBudget.map((project) => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + "..." : project.name,
    budget: Number(project.budget),
    // In a real app, you would calculate actual spending from contracts and orders
    spent: Number(project.budget) * Math.random() * 0.8, // Simulated spending
  }))

  return (
    <Card className="w-full p-4">
      <ChartContainer className="h-[300px]">
        <ChartBarChart data={data}>
          <ChartGrid strokeDasharray="3 3" />
          <ChartXAxis dataKey="name" />
          <ChartYAxis tickFormatter={(value) => formatCurrency(value).replace(/,/g, "")} />
          <ChartBar dataKey="budget" name="Budget" fill="#8884d8" />
          <ChartBar dataKey="spent" name="Spent" fill="#82ca9d" />
          <ChartTooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Project: ${label}`} />
        </ChartBarChart>
      </ChartContainer>
    </Card>
  )
}
