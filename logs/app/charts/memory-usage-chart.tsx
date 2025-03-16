"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ChevronDown, ChevronRight, Server, Monitor, X, Download } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { getMemoryUsageData } from "../actions/actions"
import { exportToExcel, prepareChartDataForExport } from "../export-utils"

// Color palette for different hosts
const COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
]

// VM color palette (slightly lighter variants)
const VM_COLORS = [
  "#60a5fa", // blue-400
  "#f87171", // red-400
  "#4ade80", // green-400
  "#c084fc", // purple-400
  "#fb923c", // orange-400
  "#22d3ee", // cyan-400
]

// Time range options
const timeRangeOptions = [
  { label: "Last Hour", value: "1h" },
  { label: "Last 6 Hours", value: "6h" },
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last 7 Days", value: "7d" },
]

export default function MemoryUsageChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [vmChartData, setVMChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState("24h")
  const [hosts, setHosts] = useState<string[]>([])
  const [vms, setVMs] = useState<{ [host: string]: string[] }>({})
  const [viewType, setViewType] = useState<"line" | "area">("line")
  const [viewMode, setViewMode] = useState<"hosts" | "vms">("hosts")
  const [expandedHosts, setExpandedHosts] = useState<{ [host: string]: boolean }>({})
  const [selectedHost, setSelectedHost] = useState<string | null>(null)
  const [selectedHosts, setSelectedHosts] = useState<string[]>([])
  const [hostFilterOpen, setHostFilterOpen] = useState(false)

  // Fetch memory usage data
  const fetchMemoryData = async () => {
    setIsLoading(true)
    try {
      // Fetch host data
      const data = await getMemoryUsageData(timeRange)

      // Process host data
      const processedData = data.timeSeriesData.map((entry) => {
        const processedEntry = { ...entry }
        for (const key of Object.keys(entry)) {
          if (key !== "timestamp" && typeof entry[key] === "object") {
            for (const subKey of Object.keys(entry[key])) {
              if (typeof entry[key][subKey] === "bigint") {
                processedEntry[key][subKey] = Number(entry[key][subKey])
              }
            }
          }
        }
        return processedEntry
      })

      setChartData(processedData)

      // Extract unique hosts
      const uniqueHosts = Array.from(
        new Set(processedData.flatMap((entry) => Object.keys(entry).filter((key) => key !== "timestamp"))),
      )

      // Set hosts and ensure all are selected by default
      setHosts(uniqueHosts as string[])
      setSelectedHosts(uniqueHosts as string[])

      // Initialize expanded state for hosts
      const initialExpandedState: { [host: string]: boolean } = {}
      uniqueHosts.forEach((host) => {
        initialExpandedState[host] = expandedHosts[host] || false
      })
      setExpandedHosts(initialExpandedState)
      const vmsByHost: { [host: string]: string[] } = {}
      setVMs(vmsByHost)
    } catch (error) {
      toast.error("Failed to fetch memory usage data")
      console.error(error)
    } finally {
      setIsLoading(false)
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

  // Select all hosts
  const handleSelectAllHosts = () => {
    setSelectedHosts([...hosts])
  }

  // Deselect all hosts
  const handleDeselectAllHosts = () => {
    setSelectedHosts([])
  }

  // Load data on initial render and when time range changes
  useEffect(() => {
    fetchMemoryData()
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

  // Toggle host expansion
  const toggleHostExpansion = (host: string) => {
    setExpandedHosts((prev) => ({
      ...prev,
      [host]: !prev[host],
    }))
  }

  // Select host for VM view
  const handleSelectHost = (host: string) => {
    setSelectedHost(host)
    setViewMode("vms")
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

  // Format memory values for display
  const formatMemory = (value: bigint | number) => {
    const numValue = typeof value === "bigint" ? Number(value) : value

    if (numValue >= 1024 * 1024 * 1024) {
      return `${(numValue / (1024 * 1024 * 1024)).toFixed(2)} GB`
    } else if (numValue >= 1024 * 1024) {
      return `${(numValue / (1024 * 1024)).toFixed(2)} MB`
    } else if (numValue >= 1024) {
      return `${(numValue / 1024).toFixed(2)} KB`
    } else {
      return `${numValue} B`
    }
  }

  // Get VM data for selected host
  const getVMDataForHost = (host: string) => {
    if (!vmChartData.length || !vms[host] || !vms[host].length) return []

    // Transform the data for chart display
    return vmChartData.map((entry) => {
      const newEntry: any = { timestamp: entry.timestamp }

      if (entry[host]) {
        vms[host].forEach((vm) => {
          if (entry[host][vm]) {
            newEntry[vm] = { percent_usage: entry[host][vm].percent_usage }
          }
        })
      }

      return newEntry
    })
  }

  // Get latest VM stats for a host
  const getLatestVMStats = (host: string) => {
    if (!vmChartData.length || !vms[host] || !vms[host].length) return []

    const latestEntry = [...vmChartData].reverse().find((entry) => entry[host])
    if (!latestEntry || !latestEntry[host]) return []

    return vms[host]
      .map((vm) => {
        if (latestEntry[host][vm]) {
          return {
            name: vm,
            ...latestEntry[host][vm],
          }
        }
        return null
      })
      .filter(Boolean)
  }

  // Handle export to Excel
  const handleExport = () => {
    if (chartData.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = prepareChartDataForExport(chartData, "memory")
      exportToExcel(exportData, `memory-usage-${timeRange}`)
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
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>
              {viewMode === "hosts" ? "Host memory usage percentage over time" : `VM memory usage for ${selectedHost}`}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewMode === "vms" && (
              <Button variant="outline" size="sm" onClick={() => setViewMode("hosts")} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Hosts
              </Button>
            )}

            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={viewType === "line" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewType("line")}
                className="rounded-none"
              >
                Line
              </Button>
              <Button
                variant={viewType === "area" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewType("area")}
                className="rounded-none"
              >
                Area
              </Button>
            </div>

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

            <Button variant="outline" size="icon" onClick={fetchMemoryData} disabled={isLoading}>
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

            {viewMode === "hosts" && (
              <Popover open={hostFilterOpen} onOpenChange={setHostFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <span>Hosts</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search hosts..." />
                    <CommandList>
                      <CommandEmpty>No host found.</CommandEmpty>
                      <CommandGroup>
                        <div className="p-2 flex justify-between border-b">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              handleSelectAllHosts()
                            }}
                          >
                            Select All
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeselectAllHosts()
                            }}
                          >
                            Clear All
                          </Button>
                        </div>
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
            )}

            <Button variant="outline" size="icon" onClick={handleExport} title="Export to Excel">
              <Download className="h-4 w-4" />
              <span className="sr-only">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      {viewMode === "hosts" && selectedHosts.length > 0 && selectedHosts.length < hosts.length && (
        <div className="px-6 pb-2 flex flex-wrap gap-1">
          {selectedHosts.map((host) => (
            <Badge key={host} variant="secondary" className="gap-1">
              {host}
              <button onClick={() => handleHostSelect(host)} className="ml-1 rounded-full hover:bg-muted p-0.5">
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
        ) : viewMode === "hosts" && chartData.length === 0 ? (
          <div className="w-full h-[300px] flex items-center justify-center border rounded-md">
            <p className="text-muted-foreground">No memory usage data available</p>
          </div>
        ) : viewMode === "vms" && (!selectedHost || getVMDataForHost(selectedHost).length === 0) ? (
          <div className="w-full h-[300px] flex items-center justify-center border rounded-md">
            <p className="text-muted-foreground">No VM memory usage data available for {selectedHost}</p>
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {viewType === "line" ? (
                <LineChart
                  data={viewMode === "hosts" ? chartData : getVMDataForHost(selectedHost!)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="timestamp" tickFormatter={formatXAxis} className="text-xs text-muted-foreground" />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    className="text-xs text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {viewMode === "hosts"
                    ? hosts
                        .filter((host) => selectedHosts.includes(host))
                        .map((host, index) => (
                          <Line
                            key={host}
                            type="monotone"
                            dataKey={`${host}.percent_usage`}
                            name={host}
                            stroke={COLORS[index % COLORS.length]}
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                        ))
                    : vms[selectedHost!]?.map((vm, index) => (
                        <Line
                          key={vm}
                          type="monotone"
                          dataKey={`${vm}.percent_usage`}
                          name={vm}
                          stroke={VM_COLORS[index % VM_COLORS.length]}
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      ))}
                </LineChart>
              ) : (
                <AreaChart
                  data={viewMode === "hosts" ? chartData : getVMDataForHost(selectedHost!)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="timestamp" tickFormatter={formatXAxis} className="text-xs text-muted-foreground" />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    className="text-xs text-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {viewMode === "hosts"
                    ? hosts
                        .filter((host) => selectedHosts.includes(host))
                        .map((host, index) => (
                          <Area
                            key={host}
                            type="monotone"
                            dataKey={`${host}.percent_usage`}
                            name={host}
                            stroke={COLORS[index % COLORS.length]}
                            fill={COLORS[index % COLORS.length]}
                            fillOpacity={0.2}
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                        ))
                    : vms[selectedHost!]?.map((vm, index) => (
                        <Area
                          key={vm}
                          type="monotone"
                          dataKey={`${vm}.percent_usage`}
                          name={vm}
                          stroke={VM_COLORS[index % VM_COLORS.length]}
                          fill={VM_COLORS[index % VM_COLORS.length]}
                          fillOpacity={0.2}
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      ))}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Memory stats summary */}
        {viewMode === "hosts" && chartData.length > 0 && hosts.length > 0 && (
          <div className="mt-4 space-y-4">
            {hosts
              .filter((host) => selectedHosts.includes(host))
              .map((host, index) => {
                // Get the latest data point for this host
                const latestData = [...chartData].reverse().find((entry) => entry[host]?.percent_usage !== undefined)
                if (!latestData || !latestData[host]) return null

                const memData = latestData[host]
                const percentUsage = memData.percent_usage
                const hasVMs = vms[host] && vms[host].length > 0

                return (
                  <div key={host} className="border rounded-md overflow-hidden">
                    <div
                      className="p-3 flex items-center justify-between bg-muted/30 cursor-pointer"
                      onClick={() => toggleHostExpansion(host)}
                    >
                      <div className="flex items-center gap-2">
                        {hasVMs ? (
                          expandedHosts[host] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )
                        ) : null}
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {host}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm font-medium ${
                            percentUsage > 80 ? "text-red-500" : percentUsage > 60 ? "text-amber-500" : "text-green-500"
                          }`}
                        >
                          {percentUsage.toFixed(1)}%
                        </span>

                        {hasVMs && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectHost(host)
                            }}
                          >
                            View VMs
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className={`p-3 ${expandedHosts[host] ? "block" : "hidden"}`}>
                      <div className="w-full bg-muted rounded-full h-2 mb-4">
                        <div
                          className={`h-2 rounded-full ${
                            percentUsage > 80 ? "bg-red-500" : percentUsage > 60 ? "bg-amber-500" : "bg-green-500"
                          }`}
                          style={{ width: `${percentUsage}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total: </span>
                          <span className="font-medium">{formatMemory(memData.total_memory)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Used: </span>
                          <span className="font-medium">{formatMemory(memData.used_memory)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Free: </span>
                          <span className="font-medium">{formatMemory(memData.free_memory)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Available: </span>
                          <span className="font-medium">{formatMemory(memData.available_memory)}</span>
                        </div>
                      </div>

                      {/* VM list */}
                      {hasVMs && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Virtual Machines</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {getLatestVMStats(host).map((vm, vmIndex) => (
                              <div key={vm.name} className="border rounded-md p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-medium flex items-center gap-1">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: VM_COLORS[vmIndex % VM_COLORS.length] }}
                                      />
                                      {vm.name}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-xs font-medium ${
                                      vm.percent_usage > 80
                                        ? "text-red-500"
                                        : vm.percent_usage > 60
                                          ? "text-amber-500"
                                          : "text-green-500"
                                    }`}
                                  >
                                    {vm.percent_usage.toFixed(1)}%
                                  </span>
                                </div>

                                <div className="w-full bg-muted rounded-full h-1.5 mb-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      vm.percent_usage > 80
                                        ? "bg-red-500"
                                        : vm.percent_usage > 60
                                          ? "bg-amber-500"
                                          : "bg-green-500"
                                    }`}
                                    style={{ width: `${vm.percent_usage}%` }}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                                  <div>
                                    <span>Total: </span>
                                    <span className="font-medium">{formatMemory(vm.total_memory)}</span>
                                  </div>
                                  <div>
                                    <span>Used: </span>
                                    <span className="font-medium">{formatMemory(vm.used_memory)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* VM Memory Stats when in VM view mode */}
        {viewMode === "vms" && selectedHost && vms[selectedHost]?.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {getLatestVMStats(selectedHost).map((vm, vmIndex) => (
              <div key={vm.name} className="p-3 border rounded-md flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: VM_COLORS[vmIndex % VM_COLORS.length] }}
                    />
                    {vm.name}
                  </h3>
                  <span
                    className={`text-sm font-medium ${
                      vm.percent_usage > 80
                        ? "text-red-500"
                        : vm.percent_usage > 60
                          ? "text-amber-500"
                          : "text-green-500"
                    }`}
                  >
                    {vm.percent_usage.toFixed(1)}%
                  </span>
                </div>

                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${
                      vm.percent_usage > 80 ? "bg-red-500" : vm.percent_usage > 60 ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${vm.percent_usage}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span>Total: </span>
                    <span className="font-medium">{formatMemory(vm.total_memory)}</span>
                  </div>
                  <div>
                    <span>Used: </span>
                    <span className="font-medium">{formatMemory(vm.used_memory)}</span>
                  </div>
                  <div>
                    <span>Free: </span>
                    <span className="font-medium">{formatMemory(vm.free_memory)}</span>
                  </div>
                  <div>
                    <span>Available: </span>
                    <span className="font-medium">{formatMemory(vm.available_memory)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ChevronLeft component
function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

