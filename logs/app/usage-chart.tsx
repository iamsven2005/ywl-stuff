"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { getDeviceUsageData } from "./actions"
import { toast } from "sonner"
import { X, Download } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { exportToExcel, prepareChartDataForExport } from "./export-utils"

// Color palette for different devices
const COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
]

// Time range options
const timeRangeOptions = [
  { label: "Last Hour", value: "1h" },
  { label: "Last 6 Hours", value: "6h" },
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last 7 Days", value: "7d" },
]

export default function UsageChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState("24h")
  const [metricType, setMetricType] = useState("cpu") // "cpu" or "mem"
  const [devices, setDevices] = useState<string[]>([])
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [deviceFilterOpen, setDeviceFilterOpen] = useState(false)

  // Fetch usage data
  const fetchUsageData = async () => {
    setIsLoading(true)
    try {
      const data = await getDeviceUsageData(timeRange)
      setChartData(data.timeSeriesData)

      // Extract unique devices
      const uniqueDevices = Array.from(
        new Set(data.timeSeriesData.flatMap((entry) => Object.keys(entry).filter((key) => key !== "timestamp"))),
      )

      // Set devices and ensure all are selected by default
      setDevices(uniqueDevices as string[])
      setSelectedDevices(uniqueDevices as string[])
    } catch (error) {
      toast.error("Failed to fetch usage data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle device selection for filtering
  const handleDeviceSelect = (value: string) => {
    if (selectedDevices.includes(value)) {
      setSelectedDevices(selectedDevices.filter((device) => device !== value))
    } else {
      setSelectedDevices([...selectedDevices, value])
    }
  }

  // Select all devices
  const handleSelectAllDevices = () => {
    setSelectedDevices([...devices])
  }

  // Deselect all devices
  const handleDeselectAllDevices = () => {
    setSelectedDevices([])
  }

  // Load data on initial render and when time range changes
  useEffect(() => {
    fetchUsageData()
  }, [timeRange])

  // Format timestamp for display
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp)

    // Different formats based on time range
    if (timeRange === "1h" || timeRange === "6h") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (timeRange === "24h") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="text-sm font-medium">{new Date(label).toLocaleString()}</p>
          <div className="mt-2 space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm">{entry.name}:</span>
                <span className="text-sm font-medium">{entry.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  // Handle export to Excel
  const handleExport = () => {
    if (chartData.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = prepareChartDataForExport(chartData, metricType)
      exportToExcel(exportData, `device-usage-${metricType}-${timeRange}`)
      toast.success("Data exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data")
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Device Usage</CardTitle>
            <CardDescription>{metricType === "cpu" ? "CPU" : "Memory"} usage over time</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={metricType} onValueChange={setMetricType} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cpu">CPU</TabsTrigger>
                <TabsTrigger value="mem">Memory</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={() => fetchUsageData()} disabled={isLoading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${isLoading ? "animate-spin" : ""}`}
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              <span className="sr-only">Refresh</span>
            </Button>

            <Popover open={deviceFilterOpen} onOpenChange={setDeviceFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span>Devices</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search devices..." />
                  <CommandList>
                    <CommandEmpty>No device found.</CommandEmpty>
                    <CommandGroup>
                      <div className="p-2 flex justify-between border-b">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleSelectAllDevices()
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeselectAllDevices()
                          }}
                        >
                          Clear All
                        </Button>
                      </div>
                      {devices.map((device) => (
                        <CommandItem key={device} onSelect={() => handleDeviceSelect(device)}>
                          <Checkbox checked={selectedDevices.includes(device)} className="mr-2" />
                          <span>{device}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={handleExport} title="Export to Excel">
              <Download className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {selectedDevices.length > 0 && selectedDevices.length < devices.length && (
        <div className="px-6 pb-2 flex flex-wrap gap-1">
          {selectedDevices.map((device) => (
            <Badge key={device} variant="secondary" className="gap-1">
              {device}
              <button onClick={() => handleDeviceSelect(device)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-[300px] flex items-center justify-center border rounded-md">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={formatXAxis} className="text-xs text-muted-foreground" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {devices
                  .filter((device) => selectedDevices.includes(device))
                  .map((device, index) => (
                    <Line
                      key={device}
                      type="monotone"
                      dataKey={`${device}.${metricType}`}
                      name={device}
                      stroke={COLORS[index % COLORS.length]}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

