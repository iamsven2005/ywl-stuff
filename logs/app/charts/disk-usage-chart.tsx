"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { HardDrive, Server, Download, X, ChevronDown } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { exportToExcel, prepareChartDataForExport } from "../export-utils"
import { getDiskUsageData } from "../actions/actions"

// Host color palette
const HOST_COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#dc2626", // red-600
  "#9333ea", // purple-600
  "#f59e0b", // amber-500
  "#0891b2", // cyan-600
  "#be185d", // pink-700
  "#4b5563", // gray-600
]

// Time range options
const timeRangeOptions = [
  { label: "Last Hour", value: "1h" },
  { label: "Last 6 Hours", value: "6h" },
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last 7 Days", value: "7d" },
]

export default function DiskUsageChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState("24h")
  const [viewMode, setViewMode] = useState<"used" | "free" | "percent">("percent")
  const [disks, setDisks] = useState<string[]>([])
  const [selectedDisks, setSelectedDisks] = useState<string[]>([])
  const [diskFilterOpen, setDiskFilterOpen] = useState(false)

  // State for hosts
  const [hosts, setHosts] = useState<string[]>([])
  const [selectedHosts, setSelectedHosts] = useState<string[]>([])
  const [hostFilterOpen, setHostFilterOpen] = useState(false)

  // Add the export function
  const handleExport = () => {
    if (chartData.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = prepareChartDataForExport(chartData, "disk")
      exportToExcel(exportData, `disk-usage-${viewMode}-${timeRange}`)
      toast.success("Disk usage data exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export disk usage data")
    }
  }

  // Fetch disk usage data
  const fetchDiskUsageData = async () => {
    setIsLoading(true)
    try {
      const data = await getDiskUsageData(timeRange)
      setChartData(data.timeSeriesData)

      // Extract unique disks and hosts
      const uniqueDisks = new Set<string>()
      const uniqueHosts = new Set<string>()

      data.timeSeriesData.forEach((entry: any) => {
        Object.keys(entry).forEach((key) => {
          if (key !== "timestamp" && key.includes("|")) {
            uniqueDisks.add(key)
            const host = key.split("|")[0]
            uniqueHosts.add(host)
          }
        })
      })

      setDisks(Array.from(uniqueDisks))

      // Set hosts and default to all hosts selected
      const hostsList = Array.from(uniqueHosts)
      setHosts(hostsList)

      // If no hosts are selected yet, select all by default
      if (selectedHosts.length === 0 && hostsList.length > 0) {
        setSelectedHosts([...hostsList])
      }

      // If no disks are selected yet, select all by default
      if (selectedDisks.length === 0 && uniqueDisks.size > 0) {
        setSelectedDisks(Array.from(uniqueDisks))
      }
    } catch (error) {
      toast.error("Failed to fetch disk usage data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle disk selection for filtering
  const handleDiskSelect = (value: string) => {
    if (selectedDisks.includes(value)) {
      setSelectedDisks(selectedDisks.filter((disk) => disk !== value))
    } else {
      setSelectedDisks([...selectedDisks, value])
    }
  }

  // Handle host selection for filtering
  const handleHostSelect = (value: string) => {
    if (selectedHosts.includes(value)) {
      setSelectedHosts(selectedHosts.filter((host) => host !== value))
    } else {
      setSelectedHosts([...selectedHosts, value])
    }
  }

  // Load data on initial render and when time range changes
  useEffect(() => {
    fetchDiskUsageData()
  }, [timeRange, viewMode])

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

  // Get color for a host
  const getHostColor = (host: string, index: number) => {
    const hostIndex = hosts.indexOf(host)
    return HOST_COLORS[hostIndex % HOST_COLORS.length]
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Group by host
      const hostGroups = payload.reduce((groups: any, entry: any) => {
        const [host, diskName] = entry.dataKey.split("|")
        if (!groups[host]) {
          groups[host] = []
        }
        groups[host].push({
          ...entry,
          diskName,
        })
        return groups
      }, {})

      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="text-sm font-medium">{new Date(label).toLocaleString()}</p>

          {Object.entries(hostGroups).map(([host, entries]: [string, any]) => (
            <div key={host} className="mt-2">
              <p className="text-xs font-semibold border-b pb-1 mb-1">{host}</p>
              <div className="space-y-1">
                {entries.map((entry: any, index: number) => {
                  const value = entry.value
                  const unit = viewMode === "percent" ? "%" : "GB"

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm">{entry.diskName}:</span>
                      <span className="text-sm font-medium">
                        {typeof value === "number" ? value.toFixed(1) : "N/A"}
                        {unit}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Process chart data to include only selected hosts and disks
  const processChartData = () => {
    if (!chartData || chartData.length === 0) return []

    // Create a new array with the same timestamps
    return chartData.map((dataPoint) => {
      const newPoint: any = { timestamp: dataPoint.timestamp }

      // For each disk, add data points if the host is selected
      Object.keys(dataPoint).forEach((key) => {
        if (key !== "timestamp" && key.includes("|")) {
          const [host, diskName] = key.split("|")

          if (selectedHosts.includes(host) && selectedDisks.includes(key)) {
            const diskData = dataPoint[key]

            // Add the appropriate metric based on view mode
            if (viewMode === "used") {
              newPoint[key] = diskData.usedGB
            } else if (viewMode === "free") {
              newPoint[key] = diskData.freeGB
            } else {
              // percent
              newPoint[key] = diskData.usedPercent
            }
          }
        }
      })

      return newPoint
    })
  }

  // Get current readings grouped by host
  const getCurrentReadingsByHost = () => {
    if (chartData.length === 0) return {}

    const latestData = chartData[chartData.length - 1]
    const readings: Record<string, any[]> = {}

    // Group readings by host
    Object.keys(latestData).forEach((key) => {
      if (key !== "timestamp" && key.includes("|")) {
        const [host, diskName] = key.split("|")

        if (selectedHosts.includes(host) && selectedDisks.includes(key)) {
          if (!readings[host]) {
            readings[host] = []
          }

          const diskData = latestData[key]
          readings[host].push({
            key,
            name: diskName,
            label: diskData.label || diskName,
            totalGB: diskData.totalGB,
            usedGB: diskData.usedGB,
            freeGB: diskData.freeGB,
            usedPercent: diskData.usedPercent,
          })
        }
      }
    })

    return readings
  }

  const processedData = processChartData()
  const currentReadingsByHost = getCurrentReadingsByHost()

  // Get a friendly name for a disk
  const getDiskDisplayName = (diskKey: string) => {
    const [host, name] = diskKey.split("|")
    return name
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Disk Usage</CardTitle>
            <CardDescription>Storage utilization across devices</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "used" | "free" | "percent")}>
              <TabsList>
                <TabsTrigger value="percent" className="gap-2">
                  <HardDrive className="h-4 w-4" />
                  Usage %
                </TabsTrigger>
                <TabsTrigger value="used" className="gap-2">
                  <HardDrive className="h-4 w-4" />
                  Used GB
                </TabsTrigger>
                <TabsTrigger value="free" className="gap-2">
                  <HardDrive className="h-4 w-4" />
                  Free GB
                </TabsTrigger>
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

            {/* Host filter dropdown */}
            <Popover open={hostFilterOpen} onOpenChange={setHostFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Server className="h-4 w-4" />
                  <span>Devices</span>
                  {selectedHosts.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1 rounded-full">
                      {selectedHosts.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search devices..." />
                  <CommandList>
                    <CommandEmpty>No devices found.</CommandEmpty>
                    <CommandGroup>
                      {hosts.map((host) => (
                        <CommandItem key={host} onSelect={() => handleHostSelect(host)}>
                          <Checkbox checked={selectedHosts.includes(host)} className="mr-2" />
                          <span>{host}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Disk filter dropdown */}
            <Popover open={diskFilterOpen} onOpenChange={setDiskFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <HardDrive className="h-4 w-4" />
                  <span>Disks</span>
                  {selectedDisks.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1 rounded-full">
                      {selectedDisks.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search disks..." />
                  <CommandList>
                    <CommandEmpty>No disks found.</CommandEmpty>
                    <CommandGroup>
                      {disks.map((disk) => (
                        <CommandItem key={disk} onSelect={() => handleDiskSelect(disk)}>
                          <Checkbox checked={selectedDisks.includes(disk)} className="mr-2" />
                          <span>{getDiskDisplayName(disk)}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={fetchDiskUsageData} disabled={isLoading}>
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

            {/* Export button */}
            <Button variant="outline" size="icon" onClick={handleExport} title="Export to Excel">
              <Download className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Selected hosts badges */}
      {selectedHosts.length > 0 && selectedHosts.length < hosts.length && (
        <div className="px-6 pb-2 flex flex-wrap gap-1">
          <span className="text-sm text-muted-foreground mr-2 my-auto">Devices:</span>
          {selectedHosts.map((host, index) => (
            <Badge key={host} variant="outline" className="gap-1" style={{ borderColor: getHostColor(host, index) }}>
              {host}
              <button onClick={() => handleHostSelect(host)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selected disks badges */}
      {selectedDisks.length > 0 && selectedDisks.length < disks.length && (
        <div className="px-6 pb-2 flex flex-wrap gap-1">
          <span className="text-sm text-muted-foreground mr-2 my-auto">Disks:</span>
          {selectedDisks.map((disk) => (
            <Badge key={disk} variant="secondary" className="gap-1">
              {getDiskDisplayName(disk)}
              <button onClick={() => handleDiskSelect(disk)} className="ml-1 rounded-full hover:bg-muted p-0.5">
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
        ) : processedData.length === 0 ? (
          <div className="w-full h-[300px] flex items-center justify-center border rounded-md">
            <p className="text-muted-foreground">No disk usage data available</p>
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={formatXAxis} className="text-xs text-muted-foreground" />
                <YAxis
                  domain={viewMode === "percent" ? [0, 100] : [0, "auto"]}
                  tickFormatter={(value) => `${value}${viewMode === "percent" ? "%" : "GB"}`}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {/* Render lines for each disk and host combination */}
                {selectedDisks.map((diskKey) => {
                  const [host, diskName] = diskKey.split("|")
                  if (!selectedHosts.includes(host)) return null

                  // Check if this combination exists in the data
                  const hasData = processedData.some((point) => diskKey in point)
                  if (!hasData) return null

                  const hostIndex = hosts.indexOf(host)
                  const color = getHostColor(host, hostIndex)

                  return (
                    <Line
                      key={diskKey}
                      type="monotone"
                      dataKey={diskKey}
                      name={`${diskName} (${host})`}
                      stroke={color}
                      strokeDasharray={hostIndex > 0 ? `${hostIndex * 3} ${hostIndex * 2}` : undefined}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Current readings summary grouped by host */}
        {Object.keys(currentReadingsByHost).length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Current Disk Usage by Device</h4>

            <div className="space-y-4">
              {Object.entries(currentReadingsByHost).map(([host, disks], hostIndex) => (
                <div key={host} className="border rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHostColor(host, hostIndex) }} />
                    <h5 className="font-medium">{host}</h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {disks.map((disk, idx) => {
                      // Calculate warning thresholds
                      const isWarning = disk.usedPercent > 70
                      const isCritical = disk.usedPercent > 90

                      return (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded-md bg-muted/20">
                          <HardDrive
                            className={`h-4 w-4 ${
                              isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-green-500"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="text-xs font-medium">{disk.label || disk.name}</p>
                              <p
                                className={`text-xs font-medium ${
                                  isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-green-500"
                                }`}
                              >
                                {disk.usedPercent.toFixed(1)}%
                              </p>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 mt-1 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-green-500"
                                }`}
                                style={{ width: `${Math.min(disk.usedPercent, 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs mt-1 text-muted-foreground">
                              {disk.usedGB.toFixed(1)} / {disk.totalGB.toFixed(1)} GB
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

