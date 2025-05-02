"use client"

import { Card } from "@/components/ui/card"
import { ChartContainer, ChartPie, ChartPieChart, ChartTooltip, ChartLegend } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

export default function MaterialCostChart({ projects }) {
  // For demonstration, create simulated material cost data
  // In a real app, you would aggregate this from actual material orders
  const materialTypes = [
    { name: "Structural Steel", value: 1250000 },
    { name: "Concrete", value: 850000 },
    { name: "Rebar", value: 450000 },
    { name: "Cables", value: 350000 },
    { name: "Bearings", value: 200000 },
    { name: "Other", value: 300000 },
  ]

  // Define colors for different material types
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  return (
    <Card className="w-full p-4">
      <ChartContainer className="h-[300px]">
        <ChartPieChart>
          <ChartPie
            data={materialTypes}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label={({ name, value, percent }) => `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`}
          >
            {materialTypes.map((entry, index) => (
              <ChartPie key={`cell-${index}`} fill={COLORS[index % COLORS.length]} data={[entry]} dataKey="value" />
            ))}
          </ChartPie>
          <ChartTooltip formatter={(value) => formatCurrency(value)} />
          <ChartLegend />
        </ChartPieChart>
      </ChartContainer>
    </Card>
  )
}
