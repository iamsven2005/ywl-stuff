"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  ChevronDown,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
  User,
  Cpu,
  MemoryStickIcon as Memory,
  Filter,
  ExternalLink,
  Terminal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Clock, AlertTriangle, Download } from "lucide-react"
import { deleteLogsByTimePeriod, deleteMultipleLogs, getLogs } from "../actions/actions"
import { getAllDeviceNames } from "../actions/device-actions"
import { exportToExcel, prepareLogsForExport } from "../export-utils"

// Debounce function to limit how often a function can run
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Host options for filtering
// Remove this static array:
// const hostOptions = [
// { label: "All Devices", value: "all" },
// { label: "VM01", value: "vm01" },
// { label: "VM02", value: "vm02" },
// { label: "Host", value: "host" }
// ]

// Add this state inside the component
// const [hostOptions, setHostOptions] = useState<{ label: string; value: string }[]>([
//   { label: "All Devices", value: "all" },
// ])

// Page size options
const pageSizeOptions = [10, 25, 50, 100, 1000, 5000]

// Action types for filtering
const actionOptions = [
  { label: "All Actions", value: "all" },
  { label: "Login", value: "login" },
  { label: "Logout", value: "logout" },
]

export default function LogsTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedHosts, setSelectedHosts] = useState<string[]>(["all"])
  const [selectedActions, setSelectedActions] = useState<string[]>(["all"])
  const [selectedLogs, setSelectedLogs] = useState<number[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hostDropdownOpen, setHostDropdownOpen] = useState(false)
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false)

  // Resource filters
  const [cpuFilter, setCpuFilter] = useState<number | null>(null)
  const [memFilter, setMemFilter] = useState<number | null>(null)
  const [showResourceFilters, setShowResourceFilters] = useState(false)

  // Command modal state
  const [commandModalOpen, setCommandModalOpen] = useState(false)
  const [selectedCommand, setSelectedCommand] = useState<{
    id: number
    command: string
    timestamp: string
    host: string
    piuser: string
    pid?: number
    cpu?: number
    mem?: number
  } | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Initialize resource filters state
  const [isResourceFiltersEnabled, setIsResourceFiltersEnabled] = useState(false)

  // Add this inside the LogsTable function, with the other state declarations:
  const [hostOptions, setHostOptions] = useState<{ label: string; value: string }[]>([
    { label: "All Devices", value: "all" },
  ])

  // Add these state variables inside the LogsTable component
  const [timeDeleteDialogOpen, setTimeDeleteDialogOpen] = useState(false)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("")
  const [isTimeDeleteLoading, setIsTimeDeleteLoading] = useState(false)

  // Apply debounced search
  const debouncedSearch = debounce((value: string) => {
    setDebouncedSearchQuery(value)
    // Reset to first page when search changes
    setCurrentPage(1)
  }, 300)

  // Update search query and trigger debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  // Fetch logs with filters
  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const hosts = selectedHosts.includes("all") ? [] : selectedHosts

      const actions = selectedActions.includes("all") ? [] : selectedActions

      const result = await getLogs({
        search: debouncedSearchQuery,
        hosts,
        actions,
        cpuThreshold: isResourceFiltersEnabled ? cpuFilter : null,
        memThreshold: isResourceFiltersEnabled ? memFilter : null,
        page: currentPage,
        pageSize: pageSize,
      })

      setLogs(result.logs)
      setTotalPages(result.pageCount)
      setTotalItems(result.totalCount)
    } catch (error) {
      toast.error("Failed to fetch logs")
    } finally {
      setIsLoading(false)
    }
  }

  // Load logs when filters or pagination changes
  useEffect(() => {
    fetchLogs()
  }, [debouncedSearchQuery, selectedHosts, selectedActions, currentPage, pageSize, isResourceFiltersEnabled])

  // Load logs when resource filters change
  // useEffect(() => {
  //   if (cpuFilter !== null || memFilter !== null) {
  //     fetchLogs()
  //   }
  // }, [cpuFilter, memFilter])

  // Handle host selection
  const handleHostSelect = (value: string) => {
    let newSelectedHosts: string[]

    if (value === "all") {
      newSelectedHosts = ["all"]
    } else {
      const currentWithoutAll = selectedHosts.filter((h) => h !== "all")

      if (currentWithoutAll.includes(value)) {
        // Remove if already selected
        const filtered = currentWithoutAll.filter((h) => h !== value)
        newSelectedHosts = filtered.length ? filtered : ["all"]
      } else {
        // Add if not selected
        newSelectedHosts = [...currentWithoutAll, value]
      }
    }

    setSelectedHosts(newSelectedHosts)
    // Reset to first page when filters change
    setCurrentPage(1)
  }

  // Handle action selection
  const handleActionSelect = (value: string) => {
    let newSelectedActions: string[]

    if (value === "all") {
      newSelectedActions = ["all"]
    } else {
      const currentWithoutAll = selectedActions.filter((a) => a !== "all")

      if (currentWithoutAll.includes(value)) {
        // Remove if already selected
        const filtered = currentWithoutAll.filter((a) => a !== value)
        newSelectedActions = filtered.length ? filtered : ["all"]
      } else {
        // Add if not selected
        newSelectedActions = [...currentWithoutAll, value]
      }
    }

    setSelectedActions(newSelectedActions)
    // Reset to first page when filters change
    setCurrentPage(1)
  }

  // Handle log selection
  const handleSelectLog = (id: number) => {
    if (selectedLogs.includes(id)) {
      setSelectedLogs(selectedLogs.filter((logId) => logId !== id))
    } else {
      setSelectedLogs([...selectedLogs, id])
    }
  }

  // Handle select all logs
  const handleSelectAll = () => {
    if (selectedLogs.length === logs.length) {
      setSelectedLogs([])
    } else {
      setSelectedLogs(logs.map((log) => log.id))
    }
  }

  // Handle delete selected logs
  const handleDeleteSelected = async () => {
    if (!selectedLogs.length) return

    try {
      await deleteMultipleLogs(selectedLogs)
      toast.success(`Deleted ${selectedLogs.length} logs`)
      setSelectedLogs([])
      fetchLogs()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete logs")
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Handle CPU filter change
  const handleCpuFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? Number.parseFloat(e.target.value) : null
    setCpuFilter(value)
  }

  // Handle Memory filter change
  const handleMemFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? Number.parseFloat(e.target.value) : null
    setMemFilter(value)
  }

  // Reset resource filters
  const resetResourceFilters = () => {
    setCpuFilter(null)
    setMemFilter(null)
    setIsResourceFiltersEnabled(false)
  }

  // Open command modal
  const openCommandModal = (log: any) => {
    if (!log.command) return

    setSelectedCommand({
      id: log.id,
      command: log.command,
      timestamp: log.timestamp,
      host: log.host || "Unknown",
      piuser: log.piuser || "Unknown",
      pid: log.pid,
      cpu: log.cpu,
      mem: log.mem,
    })
    setCommandModalOpen(true)
  }

  // Generate pagination items
  const getPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Calculate range of pages to show
    const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)

    // Adjust if we're near the beginning
    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Add this useEffect to fetch device names when component mounts
  useEffect(() => {
    const fetchDeviceNames = async () => {
      try {
        const deviceNames = await getAllDeviceNames()
        const options = [
          { label: "All Devices", value: "all" },
          ...deviceNames.map((name) => ({ label: name, value: name })),
        ]
        setHostOptions(options)
      } catch (error) {
        console.error("Failed to fetch device names:", error)
        toast.error("Failed to load device list")
      }
    }

    fetchDeviceNames()
  }, [])

  // Add this function inside the LogsTable component
  const handleDeleteByTimePeriod = async () => {
    if (!selectedTimePeriod) return

    setIsTimeDeleteLoading(true)
    try {
      const result = await deleteLogsByTimePeriod(selectedTimePeriod)
      toast.success(result.message)
      fetchLogs()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete logs by time period")
    } finally {
      setIsTimeDeleteLoading(false)
      setTimeDeleteDialogOpen(false)
    }
  }

  const handleExport = () => {
    if (logs.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = prepareLogsForExport(logs)
      exportToExcel(exportData, `system-logs-export-${new Date().toISOString().split("T")[0]}`)
      toast.success("Logs exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export logs")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search logs..."
              className="pl-8 w-[200px] sm:w-[300px]"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchLogs()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowResourceFilters(!showResourceFilters)}
            className={showResourceFilters ? "bg-muted" : ""}
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Resource Filters</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Popover open={hostDropdownOpen} onOpenChange={setHostDropdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between">
                {selectedHosts.includes("all")
                  ? "All Devices"
                  : selectedHosts.length > 1
                    ? `${selectedHosts.length} hosts selected`
                    : hostOptions.find((h) => h.value === selectedHosts[0])?.label}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search hosts..." />
                <CommandList>
                  <CommandEmpty>No host found.</CommandEmpty>
                  <CommandGroup>
                    {hostOptions.map((host) => (
                      <CommandItem key={host.value} onSelect={() => handleHostSelect(host.value)}>
                        <Checkbox checked={selectedHosts.includes(host.value)} className="mr-2" />
                        <span>{host.label}</span>
                        {selectedHosts.includes(host.value) && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={actionDropdownOpen} onOpenChange={setActionDropdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between">
                {selectedActions.includes("all")
                  ? "All Actions"
                  : selectedActions.length > 1
                    ? `${selectedActions.length} actions selected`
                    : actionOptions.find((a) => a.value === selectedActions[0])?.label}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search actions..." />
                <CommandList>
                  <CommandEmpty>No action found.</CommandEmpty>
                  <CommandGroup>
                    {actionOptions.map((action) => (
                      <CommandItem key={action.value} onSelect={() => handleActionSelect(action.value)}>
                        <Checkbox checked={selectedActions.includes(action.value)} className="mr-2" />
                        <span>{action.label}</span>
                        {selectedActions.includes(action.value) && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Clock className="h-4 w-4" />
                Time-Based Delete
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Delete logs older than</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTimePeriod("1day")
                  setTimeDeleteDialogOpen(true)
                }}
              >
                1 day
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTimePeriod("7days")
                  setTimeDeleteDialogOpen(true)
                }}
              >
                7 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTimePeriod("30days")
                  setTimeDeleteDialogOpen(true)
                }}
              >
                30 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTimePeriod("90days")
                  setTimeDeleteDialogOpen(true)
                }}
              >
                90 days
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setSelectedTimePeriod("all")
                  setTimeDeleteDialogOpen(true)
                }}
              >
                Delete All Logs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>

          {selectedLogs.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete ({selectedLogs.length})
            </Button>
          )}
        </div>
      </div>

      {/* Resource filters */}
      {showResourceFilters && (
        <div className="p-4 border rounded-md bg-muted/20 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Resource Filters</h3>
            <Button variant="ghost" size="sm" onClick={resetResourceFilters}>
              Reset
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <label htmlFor="cpu-filter" className="text-sm font-medium">
                  CPU Usage (%) Above
                </label>
              </div>
              <Input
                id="cpu-filter"
                type="number"
                min="0"
                max="100"
                step="5"
                placeholder="e.g. 50"
                value={cpuFilter || ""}
                onChange={handleCpuFilterChange}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Memory className="h-4 w-4 text-muted-foreground" />
                <label htmlFor="mem-filter" className="text-sm font-medium">
                  Memory Usage (%) Above
                </label>
              </div>
              <Input
                id="mem-filter"
                type="number"
                min="0"
                max="100"
                step="5"
                placeholder="e.g. 50"
                value={memFilter || ""}
                onChange={handleMemFilterChange}
              />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsResourceFiltersEnabled(true)}
            className="w-full sm:w-auto"
          >
            Apply Filters
          </Button>
        </div>
      )}

      {/* Selected filters badges */}
      <div className="flex flex-wrap gap-2">
        {selectedHosts.length > 0 &&
          !selectedHosts.includes("all") &&
          selectedHosts.map((host) => (
            <Badge key={host} variant="secondary" className="gap-1">
              {hostOptions.find((h) => h.value === host)?.label}
              <button onClick={() => handleHostSelect(host)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                ×
              </button>
            </Badge>
          ))}

        {selectedActions.length > 0 &&
          !selectedActions.includes("all") &&
          selectedActions.map((action) => (
            <Badge key={action} variant="secondary" className="gap-1">
              {actionOptions.find((a) => a.value === action)?.label}
              <button onClick={() => handleActionSelect(action)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                ×
              </button>
            </Badge>
          ))}

        {cpuFilter && (
          <Badge variant="secondary" className="gap-1">
            CPU &gt; {cpuFilter}%
            <button
              onClick={() => {
                setCpuFilter(null)
                setIsResourceFiltersEnabled(false)
              }}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
            >
              ×
            </button>
          </Badge>
        )}

        {memFilter && (
          <Badge variant="secondary" className="gap-1">
            Memory &gt; {memFilter}%
            <button
              onClick={() => {
                setMemFilter(null)
                setIsResourceFiltersEnabled(false)
              }}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
            >
              ×
            </button>
          </Badge>
        )}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={logs.length > 0 && selectedLogs.length === logs.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[120px]">Name</TableHead>
              <TableHead className="w-[80px]">Host</TableHead>
              <TableHead className="w-[160px]">Timestamp</TableHead>
              <TableHead className="w-[100px]">User</TableHead>
              <TableHead className="w-[80px]">PID</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
              <TableHead className="w-[80px]">CPU %</TableHead>
              <TableHead className="w-[80px]">MEM %</TableHead>
              <TableHead className="w-[180px]">Session</TableHead>
              <TableHead>Command</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Checkbox checked={selectedLogs.includes(log.id)} onCheckedChange={() => handleSelectLog(log.id)} />
                  </TableCell>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.name.toLowerCase().includes("login") && <LogIn className="h-4 w-4 text-green-500" />}
                      {log.name.toLowerCase().includes("logout") && <LogOut className="h-4 w-4 text-red-500" />}
                      {log.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.host ? (
                      <Badge variant="outline">{log.host}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>
                    {log.piuser ? (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-blue-500" />
                        {log.piuser}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{log.pid !== null ? log.pid : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {log.action ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          log.action.toLowerCase() === "start" && "bg-green-50 text-green-700 border-green-200",
                          log.action.toLowerCase() === "stop" && "bg-red-50 text-red-700 border-red-200",
                          log.action.toLowerCase() === "restart" && "bg-amber-50 text-amber-700 border-amber-200",
                        )}
                      >
                        {log.action}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.cpu !== null ? (
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            log.cpu > 80 ? "text-red-500" : log.cpu > 50 ? "text-amber-500" : "text-green-500",
                          )}
                        >
                          {log.cpu.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.mem !== null ? (
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            log.mem > 80 ? "text-red-500" : log.mem > 50 ? "text-amber-500" : "text-green-500",
                          )}
                        >
                          {log.mem.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.logoutTime && (
                      <div className="flex flex-col text-sm">
                        <span className="flex items-center gap-1">
                          <LogIn className="h-3 w-3 text-green-500" />
                          {formatDate(log.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <LogOut className="h-3 w-3 text-red-500" />
                          {formatDate(log.logoutTime)}
                        </span>
                      </div>
                    )}
                    {log.loginTime && (
                      <div className="flex flex-col text-sm">
                        <span className="flex items-center gap-1">
                          <LogIn className="h-3 w-3 text-green-500" />
                          {formatDate(log.loginTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <LogOut className="h-3 w-3 text-red-500" />
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.command ? (
                      <div className="max-w-[200px] truncate" title={log.command}>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{log.command}</code>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.command && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openCommandModal(log)}
                        title="View Command Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View Command Details</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {logs.length} of {totalItems} results
          </span>
          <select
            className="h-8 w-[70px] rounded-md border border-input bg-background px-2 text-sm"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                isActive={currentPage > 1}
              />
            </PaginationItem>

            {getPaginationItems()}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                isActive={currentPage < totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Command Detail Modal */}
      <Dialog open={commandModalOpen} onOpenChange={setCommandModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Command Details</DialogTitle>
            <DialogDescription>Detailed information about the executed command</DialogDescription>
          </DialogHeader>

          {selectedCommand && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
                  <p>{selectedCommand.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Timestamp</h3>
                  <p>{formatDate(selectedCommand.timestamp)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Host</h3>
                  <p>{selectedCommand.host}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">User</h3>
                  <p>{selectedCommand.piuser}</p>
                </div>
                {selectedCommand.pid !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Process ID</h3>
                    <p>{selectedCommand.pid}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                {selectedCommand.cpu !== undefined && (
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU Usage:</span>
                    <span
                      className={cn(
                        "text-sm",
                        selectedCommand.cpu > 80
                          ? "text-red-500"
                          : selectedCommand.cpu > 50
                            ? "text-amber-500"
                            : "text-green-500",
                      )}
                    >
                      {selectedCommand.cpu.toFixed(1)}%
                    </span>
                  </div>
                )}

                {selectedCommand.mem !== undefined && (
                  <div className="flex items-center gap-2">
                    <Memory className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory Usage:</span>
                    <span
                      className={cn(
                        "text-sm",
                        selectedCommand.mem > 80
                          ? "text-red-500"
                          : selectedCommand.mem > 50
                            ? "text-amber-500"
                            : "text-green-500",
                      )}
                    >
                      {selectedCommand.mem.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Command</h3>
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Shell Command</span>
                  </div>
                  <code className="whitespace-pre-wrap text-sm break-all">{selectedCommand.command}</code>
                </div>
              </div>

              {/* Command analysis section */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-700 mb-2">Command Analysis</h3>
                <div className="space-y-2">
                  {selectedCommand.command.includes("sudo") && (
                    <p className="text-sm text-blue-600">
                      <span className="font-medium">Elevated Privileges:</span> This command was executed with sudo,
                      granting root/administrator privileges.
                    </p>
                  )}

                  {selectedCommand.command.includes("rm") && (
                    <p className="text-sm text-blue-600">
                      <span className="font-medium">File Deletion:</span> This command removes files or directories from
                      the system.
                    </p>
                  )}

                  {selectedCommand.command.includes("ssh") && (
                    <p className="text-sm text-blue-600">
                      <span className="font-medium">Remote Access:</span> This command establishes a secure shell
                      connection to another system.
                    </p>
                  )}

                  {selectedCommand.command.includes("apt") ||
                    selectedCommand.command.includes("yum") ||
                    (selectedCommand.command.includes("dnf") && (
                      <p className="text-sm text-blue-600">
                        <span className="font-medium">Package Management:</span> This command installs, updates, or
                        removes software packages.
                      </p>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Time-based Delete Confirmation Dialog */}
      <AlertDialog open={timeDeleteDialogOpen} onOpenChange={setTimeDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Time-Based Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTimePeriod === "all" ? (
                <span className="text-red-500 font-medium">
                  You are about to delete ALL system logs. This action cannot be undone.
                </span>
              ) : (
                <>
                  You are about to delete all system logs older than{" "}
                  <span className="font-medium">
                    {selectedTimePeriod === "1day" && "1 day"}
                    {selectedTimePeriod === "7days" && "7 days"}
                    {selectedTimePeriod === "30days" && "30 days"}
                    {selectedTimePeriod === "90days" && "90 days"}
                  </span>
                  . This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTimeDeleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteByTimePeriod()
              }}
              disabled={isTimeDeleteLoading}
              className={selectedTimePeriod === "all" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isTimeDeleteLoading ? "Deleting..." : "Delete Logs"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

