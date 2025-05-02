"use client"

import * as React from "react"
import { AreaChart, BarChart, LineChart, PieChart, RadarChart } from "recharts"
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface ChartConfig {
  series: any[]
  height?: number
  width?: number
  colors?: string[]
  showXAxis?: boolean
  showYAxis?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showCartesianGrid?: boolean
  showPolarGrid?: boolean
  showPolarRadiusAxis?: boolean
  [key: string]: any
}

export const Chart = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig
  }
>(({ config, className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
})
Chart.displayName = "Chart"

export const ChartContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    )
  },
)
ChartContainer.displayName = "ChartContainer"

export const ChartArea = React.forwardRef<React.ElementRef<typeof Area>, React.ComponentPropsWithoutRef<typeof Area>>(
  (props, ref) => <Area ref={ref} {...props} />,
)
ChartArea.displayName = "ChartArea"

export const ChartBar = React.forwardRef<React.ElementRef<typeof Bar>, React.ComponentPropsWithoutRef<typeof Bar>>(
  (props, ref) => <Bar ref={ref} {...props} />,
)
ChartBar.displayName = "ChartBar"

export const ChartCell = React.forwardRef<React.ElementRef<typeof Cell>, React.ComponentPropsWithoutRef<typeof Cell>>(
  (props, ref) => <Cell ref={ref} {...props} />,
)
ChartCell.displayName = "ChartCell"

export const ChartGrid = React.forwardRef<
  React.ElementRef<typeof CartesianGrid>,
  React.ComponentPropsWithoutRef<typeof CartesianGrid>
>((props, ref) => <CartesianGrid ref={ref} {...props} />)
ChartGrid.displayName = "ChartGrid"

export const ChartLegend = React.forwardRef<
  React.ElementRef<typeof Legend>,
  React.ComponentPropsWithoutRef<typeof Legend>
>((props, ref) => <Legend ref={ref} {...props} />)
ChartLegend.displayName = "ChartLegend"

export const ChartLine = React.forwardRef<React.ElementRef<typeof Line>, React.ComponentPropsWithoutRef<typeof Line>>(
  (props, ref) => <Line ref={ref} {...props} />,
)
ChartLine.displayName = "ChartLine"

export const ChartPie = React.forwardRef<React.ElementRef<typeof Pie>, React.ComponentPropsWithoutRef<typeof Pie>>(
  (props, ref) => <Pie ref={ref} {...props} />,
)
ChartPie.displayName = "ChartPie"

export const ChartPolarGrid = React.forwardRef<
  React.ElementRef<typeof PolarGrid>,
  React.ComponentPropsWithoutRef<typeof PolarGrid>
>((props, ref) => <PolarGrid ref={ref} {...props} />)
ChartPolarGrid.displayName = "ChartPolarGrid"

export const ChartPolarRadiusAxis = React.forwardRef<
  React.ElementRef<typeof PolarRadiusAxis>,
  React.ComponentPropsWithoutRef<typeof PolarRadiusAxis>
>((props, ref) => <PolarRadiusAxis ref={ref} {...props} />)
ChartPolarRadiusAxis.displayName = "ChartPolarRadiusAxis"

export const ChartRadar = React.forwardRef<
  React.ElementRef<typeof Radar>,
  React.ComponentPropsWithoutRef<typeof Radar>
>((props, ref) => <Radar ref={ref} {...props} />)
ChartRadar.displayName = "ChartRadar"

export const ChartRadialBar = React.forwardRef<
  React.ElementRef<typeof RadialBar>,
  React.ComponentPropsWithoutRef<typeof RadialBar>
>((props, ref) => <RadialBar ref={ref} {...props} />)
ChartRadialBar.displayName = "ChartRadialBar"

export const ChartReferenceLine = React.forwardRef<
  React.ElementRef<typeof ReferenceLine>,
  React.ComponentPropsWithoutRef<typeof ReferenceLine>
>((props, ref) => <ReferenceLine ref={ref} {...props} />)
ChartReferenceLine.displayName = "ChartReferenceLine"

export const ChartTooltip = React.forwardRef<
  React.ElementRef<typeof Tooltip>,
  React.ComponentPropsWithoutRef<typeof Tooltip>
>((props, ref) => <Tooltip ref={ref} {...props} />)
ChartTooltip.displayName = "ChartTooltip"

export const ChartXAxis = React.forwardRef<
  React.ElementRef<typeof XAxis>,
  React.ComponentPropsWithoutRef<typeof XAxis>
>((props, ref) => <XAxis ref={ref} {...props} />)
ChartXAxis.displayName = "ChartXAxis"

export const ChartYAxis = React.forwardRef<
  React.ElementRef<typeof YAxis>,
  React.ComponentPropsWithoutRef<typeof YAxis>
>((props, ref) => <YAxis ref={ref} {...props} />)
ChartYAxis.displayName = "ChartYAxis"

// Chart types
export const ChartAreaChart = React.forwardRef<
  React.ElementRef<typeof AreaChart>,
  React.ComponentPropsWithoutRef<typeof AreaChart>
>((props, ref) => <AreaChart ref={ref} {...props} />)
ChartAreaChart.displayName = "ChartAreaChart"

export const ChartBarChart = React.forwardRef<
  React.ElementRef<typeof BarChart>,
  React.ComponentPropsWithoutRef<typeof BarChart>
>((props, ref) => <BarChart ref={ref} {...props} />)
ChartBarChart.displayName = "ChartBarChart"

export const ChartLineChart = React.forwardRef<
  React.ElementRef<typeof LineChart>,
  React.ComponentPropsWithoutRef<typeof LineChart>
>((props, ref) => <LineChart ref={ref} {...props} />)
ChartLineChart.displayName = "ChartLineChart"

export const ChartPieChart = React.forwardRef<
  React.ElementRef<typeof PieChart>,
  React.ComponentPropsWithoutRef<typeof PieChart>
>((props, ref) => <PieChart ref={ref} {...props} />)
ChartPieChart.displayName = "ChartPieChart"

export const ChartRadarChart = React.forwardRef<
  React.ElementRef<typeof RadarChart>,
  React.ComponentPropsWithoutRef<typeof RadarChart>
>((props, ref) => <RadarChart ref={ref} {...props} />)
ChartRadarChart.displayName = "ChartRadarChart"

export const ChartRadialBarChart = React.forwardRef<
  React.ElementRef<typeof RadialBarChart>,
  React.ComponentPropsWithoutRef<typeof RadialBarChart>
>((props, ref) => <RadialBarChart ref={ref} {...props} />)
ChartRadialBarChart.displayName = "ChartRadialBarChart"
