"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Thermometer, Zap, Server, Download, X, ChevronDown } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { exportToExcel, prepareChartDataForExport } from "../export-utils"
import { getSensorData } from "../actions/actions"

// Color palette for different sensors
const TEMP_COLORS = {
  "Package id 0": "#2563eb", // blue-600
  "Core 0": "#16a34a", // green-600
  "Core 1": "#15803d", // green-700
  "Core 2": "#166534", // green-800
  "Core 3": "#14532d", // green-900
  temp1: "#dc2626", // red-600
  temp2: "#9f1239", // rose-800
}

const VOLTAGE_COLORS = {
  "GPU core": "#9333ea", // purple-600
}

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

export default function SensorChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState("24h")
  const [viewMode, setViewMode] = useState<"temperature" | "voltage">("temperature")
  const [sensors, setSensors] = useState<{
    temperature: string[]
    voltage: string[]
  }>({
    temperature: [],
    voltage: [],
  })
  const [selectedSensors, setSelectedSensors] = useState<string[]>([])
  const [sensorFilterOpen, setSensorFilterOpen] = useState(false)

  // New state for hosts
  const [hosts, setHosts] = useState<string[]>([])
  const [selectedHosts, setSelectedHosts] = useState<string[]>([])
  const [hostFilterOpen, setHostFilterOpen] = useState(false)

  // Add the export function inside the SensorChart component
  const handleExport = () => {
    if (chartData.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = prepareChartDataForExport(chartData, "sensor")
      exportToExcel(exportData, `sensor-data-${viewMode}-${timeRange}`)
      toast.success("Sensor data exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export sensor data")
    }
  }

  // Fetch sensor data
  const fetchSensorData = async () => {
    setIsLoading(true)
    try {
      const data = await getSensorData(timeRange)
      setChartData(data.timeSeriesData)

      // Extract unique sensors by type and hosts
      const tempSensors = new Set<string>()
      const voltSensors = new Set<string>()
      const uniqueHosts = new Set<string>()

      data.timeSeriesData.forEach((entry: any) => {
        Object.keys(entry).forEach((key) => {
          if (key !== "timestamp") {
            if (entry[key].type === "temperature") {
              tempSensors.add(key)
            } else if (entry[key].type === "voltage") {
              voltSensors.add(key)
            }

            // Extract host from the data if available
            if (entry[key].host) {
              uniqueHosts.add(entry[key].host)
            }
          }
        })
      })

      setSensors({
        temperature: Array.from(tempSensors),
        voltage: Array.from(voltSensors),
      })

      // Set hosts and default to all hosts selected
      const hostsList = Array.from(uniqueHosts)
      setHosts(hostsList)

      // If no hosts are selected yet, select all by default
      if (selectedHosts.length === 0 && hostsList.length > 0) {
        setSelectedHosts([...hostsList])
      }
    } catch (error) {
      toast.error("Failed to fetch sensor data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sensor selection for filtering
  const handleSensorSelect = (value: string) => {
    if (selectedSensors.includes(value)) {
      setSelectedSensors(selectedSensors.filter((sensor) => sensor !== value))
    } else {
      setSelectedSensors([...selectedSensors, value])
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
    fetchSensorData().then(() => {
      const currentSensors = viewMode === "temperature" ? sensors.temperature : sensors.voltage
      if (currentSensors.length > 0 && selectedSensors.length === 0) {
        setSelectedSensors([...currentSensors])
      }
    })
  }, [timeRange, viewMode])

  // Add useEffect to update selected sensors when view mode changes
  useEffect(() => {
    // Reset selected sensors when switching between temperature and voltage
    setSelectedSensors([])
  }, [viewMode])

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
    return HOST_COLORS[index % HOST_COLORS.length]
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Group by host
      const hostGroups = payload.reduce((groups: any, entry: any) => {
        const [sensorName, hostName] = entry.dataKey.split("|")
        if (!groups[hostName]) {
          groups[hostName] = []
        }
        groups[hostName].push({
          ...entry,
          sensorName,
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
                {entries.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm">{entry.sensorName}:</span>
                    <span className="text-sm font-medium">
                      {entry.value.toFixed(1)}
                      {viewMode === "temperature" ? "°C" : "mV"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Process chart data to include host information
  const processChartData = () => {
    if (!chartData || chartData.length === 0) return []

    // Create a new array with the same timestamps
    return chartData.map((dataPoint) => {
      const newPoint: any = { timestamp: dataPoint.timestamp }

      // For each sensor, add host-specific data points
      Object.keys(dataPoint).forEach((key) => {
        if (key !== "timestamp") {
          const sensorData = dataPoint[key]
          if (sensorData && sensorData.host && selectedHosts.includes(sensorData.host)) {
            // Use a composite key of sensor|host to uniquely identify each line
            newPoint[`${key}|${sensorData.host}`] = sensorData.value
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
      if (key !== "timestamp") {
        const sensorData = latestData[key]
        if (sensorData && sensorData.host && selectedHosts.includes(sensorData.host)) {
          if (!readings[sensorData.host]) {
            readings[sensorData.host] = []
          }

          if (
            (viewMode === "temperature" && sensorData.type === "temperature") ||
            (viewMode === "voltage" && sensorData.type === "voltage")
          ) {
            if (selectedSensors.includes(key)) {
              readings[sensorData.host].push({
                sensor: key,
                value: sensorData.value,
                type: sensorData.type,
              })
            }
          }
        }
      }
    })

    return readings
  }

  const processedData = processChartData()
  const currentReadingsByHost = getCurrentReadingsByHost()

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>System Sensors</CardTitle>
            <CardDescription>
              {viewMode === "temperature" ? "Temperature readings" : "Voltage measurements"} across devices
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "temperature" | "voltage")}>
              <TabsList>
                <TabsTrigger value="temperature" className="gap-2">
                  <Thermometer className="h-4 w-4" />
                  Temperature
                </TabsTrigger>
                <TabsTrigger value="voltage" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Voltage
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

            {/* Sensor filter dropdown */}
            <Popover open={sensorFilterOpen} onOpenChange={setSensorFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span>Sensors</span>
                  {selectedSensors.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1 rounded-full">
                      {selectedSensors.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search sensors..." />
                  <CommandList>
                    <CommandEmpty>No sensor found.</CommandEmpty>
                    <CommandGroup>
                      {(viewMode === "temperature" ? sensors.temperature : sensors.voltage).map((sensor) => (
                        <CommandItem key={sensor} onSelect={() => handleSensorSelect(sensor)}>
                          <Checkbox checked={selectedSensors.includes(sensor)} className="mr-2" />
                          <span>{sensor}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={fetchSensorData} disabled={isLoading}>
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

      {/* Selected sensors badges */}
      {selectedSensors.length > 0 &&
        selectedSensors.length < (viewMode === "temperature" ? sensors.temperature.length : sensors.voltage.length) && (
          <div className="px-6 pb-2 flex flex-wrap gap-1">
            <span className="text-sm text-muted-foreground mr-2 my-auto">Sensors:</span>
            {selectedSensors.map((sensor) => (
              <Badge key={sensor} variant="secondary" className="gap-1">
                {sensor}
                <button onClick={() => handleSensorSelect(sensor)} className="ml-1 rounded-full hover:bg-muted p-0.5">
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
            <p className="text-muted-foreground">No sensor data available</p>
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="timestamp" tickFormatter={formatXAxis} className="text-xs text-muted-foreground" />
                <YAxis
                  domain={viewMode === "temperature" ? [0, 100] : [0, 1200]}
                  tickFormatter={(value) => `${value}${viewMode === "temperature" ? "°C" : "mV"}`}
                  className="text-xs text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {/* Render lines for each sensor and host combination */}
                {selectedHosts.map((host, hostIndex) =>
                  selectedSensors.map((sensor) => {
                    const dataKey = `${sensor}|${host}`
                    // Check if this combination exists in the data
                    const hasData = processedData.some((point) => dataKey in point)
                    if (!hasData) return null

                    return (
                      <Line
                        key={dataKey}
                        type="monotone"
                        dataKey={dataKey}
                        name={`${sensor} (${host})`}
                        stroke={getHostColor(host, hostIndex)}
                        strokeDasharray={hostIndex > 0 ? `${hostIndex * 3} ${hostIndex * 2}` : undefined}
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    )
                  }),
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Current readings summary grouped by host */}
        {Object.keys(currentReadingsByHost).length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Current Readings by Device</h4>

            <div className="space-y-4">
              {Object.entries(currentReadingsByHost).map(([host, readings], hostIndex) => (
                <div key={host} className="border rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHostColor(host, hostIndex) }} />
                    <h5 className="font-medium">{host}</h5>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {readings.map((reading, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 border rounded-md bg-muted/20">
                        {viewMode === "temperature" ? (
                          <Thermometer
                            className={`h-4 w-4 ${
                              reading.value > 80
                                ? "text-red-500"
                                : reading.value > 60
                                  ? "text-amber-500"
                                  : "text-green-500"
                            }`}
                          />
                        ) : (
                          <Zap className="h-4 w-4 text-purple-500" />
                        )}
                        <div>
                          <p className="text-xs font-medium">{reading.sensor}</p>
                          <p
                            className={`text-sm font-medium ${
                              viewMode === "temperature"
                                ? reading.value > 80
                                  ? "text-red-500"
                                  : reading.value > 60
                                    ? "text-amber-500"
                                    : "text-green-500"
                                : "text-purple-500"
                            }`}
                          >
                            {reading.value.toFixed(1)}
                            {viewMode === "temperature" ? "°C" : "mV"}
                          </p>
                        </div>
                      </div>
                    ))}
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

