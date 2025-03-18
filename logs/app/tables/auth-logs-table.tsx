"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
  RefreshCw,
  Search,
  Trash2,
  Terminal,
  ExternalLink,
  Clock,
  AlertTriangle,
  Download,
  Plus,
  BookOpen,
  FileCode,
} from "lucide-react"
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
import { getAllDeviceNames } from "../actions/device-actions"
import {
  addAuthLogCommandToRule,
  deleteAuthLogsByTimePeriod,
  deleteMultipleAuthLogs,
  getAuthLogs,
} from "../actions/auth-actions"
import { exportToExcel, prepareAuthLogsForExport } from "../export-utils"
import { getAllRuleGroupsAndRules } from "../actions/rule-actions"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Rule } from "@prisma/client"
// Add this import at the top with the other imports
import { processBatchForCommandMatches } from "../actions/command-monitoring-actions"
// Add this import at the top with the other imports
import { CommandMatchAlert } from "@/components/command-match-alert"

// Debounce function to limit how often a function can run
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Page size options
const pageSizeOptions = [10, 25, 50, 100]

export default function AuthLogsTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedHosts, setSelectedHosts] = useState<string[]>(["all"])
  const [selectedLogs, setSelectedLogs] = useState<number[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedLogEntry, setSelectedLogEntry] = useState<{
    id: number
    timestamp: string
    username: string
    log_entry: string
    parsedData?: Record<string, string>
  } | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [hostOptions, setHostOptions] = useState<{ label: string; value: string }[]>([
    { label: "All Devices", value: "all" },
  ])

  const [timeDeleteDialogOpen, setTimeDeleteDialogOpen] = useState(false)
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("")
  const [isTimeDeleteLoading, setIsTimeDeleteLoading] = useState(false)

  // Add state for rule groups and rules
  const [ruleGroups, setRuleGroups] = useState<any[]>([])
  const [selectedRuleGroups, setSelectedRuleGroups] = useState<string[]>([])
  const [selectedRules, setSelectedRules] = useState<string[]>([])
  const [ruleGroupDropdownOpen, setRuleGroupDropdownOpen] = useState(false)
  const [ruleDropdownOpen, setRuleDropdownOpen] = useState(false)
  const [matchedCommands, setMatchedCommands] = useState<string[]>([])
  // Add this state inside the AuthLogsTable component
  const [commandMatches, setCommandMatches] = useState<any[]>([])

  // Add state for the "Add to Rule" dialog
  const [addToRuleDialogOpen, setAddToRuleDialogOpen] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState<string>("")
  const [commandText, setCommandText] = useState<string>("")
  const [isAddingCommand, setIsAddingCommand] = useState(false)

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

  // Add useEffect to fetch rule groups and rules
  useEffect(() => {
    const fetchRuleGroupsAndRules = async () => {
      try {
        const ruleGroupsData = await getAllRuleGroupsAndRules()
        setRuleGroups(ruleGroupsData)
      } catch (error) {
        console.error("Failed to fetch rule groups and rules:", error)
        toast.error("Failed to load rule groups and rules")
      }
    }

    fetchRuleGroupsAndRules()
  }, [])

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
  // Modify the fetchLogs function to check for command matches
  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const hosts = selectedHosts.includes("all") ? [] : selectedHosts

      const result = await getAuthLogs({
        search: debouncedSearchQuery,
        hosts,
        ruleGroups: selectedRuleGroups,
        rules: selectedRules,
        page: currentPage,
        pageSize: pageSize,
      })

      setLogs(result.logs)
      setTotalPages(result.pageCount)
      setTotalItems(result.totalCount)
      setMatchedCommands(result.matchedCommands || [])

      // Check for command matches
      const matches = await processBatchForCommandMatches(result.logs, "auth")
      setCommandMatches(matches)

      // Show toast notifications for matches
      if (matches.length > 0) {
        matches.forEach((match: any) => {
          toast.info(
            <div>
              <p className="font-medium">Command Match Detected</p>
              <p className="text-sm">Rule: {match.ruleName}</p>
              <p className="text-sm">
                Command: <code className="bg-muted px-1 rounded">{match.command}</code>
              </p>
              {match.emailTemplateId && (
                <p className="text-xs mt-1 text-muted-foreground">
                  Email notification sent via template: {match.emailTemplateName}
                </p>
              )}
            </div>,
            {
              duration: 5000,
            },
          )
        })
      }
    } catch (error) {
      toast.error("Failed to fetch auth logs")
    } finally {
      setIsLoading(false)
    }
  }

  // Load logs when filters or pagination changes
  useEffect(() => {
    fetchLogs()
  }, [debouncedSearchQuery, selectedHosts, selectedRuleGroups, selectedRules, currentPage, pageSize])

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

  // Add handlers for rule group and rule selection
  const handleRuleGroupSelect = (value: string) => {
    if (selectedRuleGroups.includes(value)) {
      setSelectedRuleGroups(selectedRuleGroups.filter((id) => id !== value))
    } else {
      setSelectedRuleGroups([...selectedRuleGroups, value])
    }
    setCurrentPage(1)
  }

  const handleRuleSelect = (value: string) => {
    if (selectedRules.includes(value)) {
      setSelectedRules(selectedRules.filter((id) => id !== value))
    } else {
      setSelectedRules([...selectedRules, value])
    }
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
      await deleteMultipleAuthLogs(selectedLogs)
      toast.success(`Deleted ${selectedLogs.length} auth logs`)
      setSelectedLogs([])
      fetchLogs()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete auth logs")
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

  // Open log entry modal
  const openLogEntryModal = (log: any) => {
    // Parse the log entry to extract structured data
    const parsedData = parseLogEntry(log.log_entry)

    setSelectedLogEntry({
      ...log,
      parsedData,
    })
    setModalOpen(true)
  }

  // Open add to rule dialog
  const openAddToRuleDialog = (log: any) => {
    // Extract command from log entry if possible
    const parsedData = parseLogEntry(log.log_entry)
    const extractedCommand = parsedData.command || ""

    setSelectedLogEntry(log)
    setCommandText(extractedCommand)
    setSelectedRuleId("")
    setAddToRuleDialogOpen(true)
  }

  // Handle adding command to rule
  const handleAddCommandToRule = async () => {
    if (!selectedLogEntry || !selectedRuleId || !commandText.trim()) {
      toast.error("Please select a rule and enter a command")
      return
    }

    setIsAddingCommand(true)
    try {
      const result = await addAuthLogCommandToRule(selectedLogEntry.id, Number.parseInt(selectedRuleId), commandText)

      toast.success(result.message)
      setAddToRuleDialogOpen(false)

      // Refresh rule groups to show the new command
      const ruleGroupsData = await getAllRuleGroupsAndRules()
      setRuleGroups(ruleGroupsData)
    } catch (error) {
      toast.error(`Failed to add command: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsAddingCommand(false)
    }
  }

  // Parse log entry to extract structured data
  const parseLogEntry = (logEntry: string): Record<string, string> => {
    const result: Record<string, string> = {}

    // Extract timestamp and host
    const timestampMatch = logEntry.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+\+\d{2}:\d{2})/)
    if (timestampMatch) {
      result.timestamp = timestampMatch[1]
    }

    // Extract host
    const parts = logEntry.split(" ")
    if (parts.length >= 2) {
      result.host = parts[1]
    }

    // Extract service
    if (parts.length >= 3) {
      const servicePart = parts[2]
      result.service = servicePart.replace(":", "")
    }

    // Extract user if present
    const userMatch = logEntry.match(/USER=(\w+)/)
    if (userMatch) {
      result.user = userMatch[1]
    }

    // Extract command if present
    const commandMatch = logEntry.match(/COMMAND=(.+)$/)
    if (commandMatch) {
      result.command = commandMatch[1]
    }

    // Extract TTY if present
    const ttyMatch = logEntry.match(/TTY=(\S+)/)
    if (ttyMatch) {
      result.tty = ttyMatch[1]
    }

    // Extract PWD if present
    const pwdMatch = logEntry.match(/PWD=(\S+)/)
    if (pwdMatch) {
      result.pwd = pwdMatch[1]
    }

    // Extract session info
    if (logEntry.includes("session opened") || logEntry.includes("session closed")) {
      result.sessionStatus = logEntry.includes("session opened") ? "opened" : "closed"
      const userForMatch = logEntry.match(/for user (\w+)/)
      if (userForMatch) {
        result.sessionUser = userForMatch[1]
      }
    }

    return result
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

  const handleDeleteByTimePeriod = async () => {
    if (!selectedTimePeriod) return

    setIsTimeDeleteLoading(true)
    try {
      const result = await deleteAuthLogsByTimePeriod(selectedTimePeriod)
      toast.success(result.message)
      fetchLogs()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete auth logs by time period")
    } finally {
      setIsTimeDeleteLoading(false)
      setTimeDeleteDialogOpen(false)
    }
  }

  // Add the export function inside the AuthLogsTable component
  const handleExport = () => {
    if (logs.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = prepareAuthLogsForExport(logs)
      exportToExcel(exportData, `auth-logs-export-${new Date().toISOString().split("T")[0]}`)
      toast.success("Auth logs exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export auth logs")
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
              placeholder="Search auth logs..."
              className="pl-8 w-[200px] sm:w-[300px]"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchLogs()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Popover open={open} onOpenChange={setOpen}>
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

          {/* Add Rule Group filter */}
          <Popover open={ruleGroupDropdownOpen} onOpenChange={setRuleGroupDropdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between">
                {selectedRuleGroups.length > 0
                  ? `${selectedRuleGroups.length} rule group${selectedRuleGroups.length > 1 ? "s" : ""} selected`
                  : "Rule Groups"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search rule groups..." />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No rule group found.</CommandEmpty>
                  <CommandGroup>
                    {ruleGroups.map((group) => (
                      <CommandItem key={group.id} onSelect={() => handleRuleGroupSelect(group.id.toString())}>
                        <Checkbox checked={selectedRuleGroups.includes(group.id.toString())} className="mr-2" />
                        <span>{group.name}</span>
                        {selectedRuleGroups.includes(group.id.toString()) && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Add Rule filter */}
          <Popover open={ruleDropdownOpen} onOpenChange={setRuleDropdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-between">
                {selectedRules.length > 0
                  ? `${selectedRules.length} rule${selectedRules.length > 1 ? "s" : ""} selected`
                  : "Rules"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search rules..." />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No rule found.</CommandEmpty>
                  <CommandGroup>
                    {ruleGroups.flatMap((group) =>
                      group.rules.map((rule: Rule) => (
                        <CommandItem key={rule.id} onSelect={() => handleRuleSelect(rule.id.toString())}>
                          <Checkbox checked={selectedRules.includes(rule.id.toString())} className="mr-2" />
                          <span>{rule.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">({group.name})</span>
                          {selectedRules.includes(rule.id.toString()) && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      )),
                    )}
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

          {/* Add the export button here, before the delete button */}
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

        {selectedRuleGroups.length > 0 &&
          selectedRuleGroups.map((groupId) => {
            const group = ruleGroups.find((g) => g.id.toString() === groupId)
            return group ? (
              <Badge key={`group-${groupId}`} variant="secondary" className="gap-1">
                Group: {group.name}
                <button
                  onClick={() => handleRuleGroupSelect(groupId)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  ×
                </button>
              </Badge>
            ) : null
          })}

        {selectedRules.length > 0 &&
          selectedRules.map((ruleId) => {
            const rule = ruleGroups.flatMap((g) => g.rules).find((r) => r.id.toString() === ruleId)
            return rule ? (
              <Badge key={`rule-${ruleId}`} variant="secondary" className="gap-1">
                Rule: {rule.name}
                <button onClick={() => handleRuleSelect(ruleId)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                  ×
                </button>
              </Badge>
            ) : null
          })}
      </div>
      {commandMatches.length > 0 && (
        <div className="mb-4">
          <CommandMatchAlert matches={commandMatches} />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={logs.length > 0 && selectedLogs.length === logs.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[150px]">Timestamp</TableHead>
              <TableHead className="w-[100px]">Username</TableHead>
              <TableHead>Log Entry</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No auth logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Checkbox checked={selectedLogs.includes(log.id)} onCheckedChange={() => handleSelectLog(log.id)} />
                  </TableCell>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-blue-500" />
                      {log.username}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[600px] truncate" title={log.log_entry}>
                      {log.log_entry}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openLogEntryModal(log)} title="View Details">
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openAddToRuleDialog(log)} title="Add to Rule">
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Add to Rule</span>
                      </Button>
                    </div>
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

      {/* Log Entry Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Auth Log Details</DialogTitle>
            <DialogDescription>Detailed information about the selected auth log entry.</DialogDescription>
          </DialogHeader>

          {selectedLogEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
                  <p>{selectedLogEntry.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Timestamp</h3>
                  <p>{formatDate(selectedLogEntry.timestamp)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                  <p>{selectedLogEntry.username}</p>
                </div>
                {selectedLogEntry.parsedData?.host && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Host</h3>
                    <p>{selectedLogEntry.parsedData.host}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Log Entry</h3>
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code className="whitespace-pre-wrap text-sm">{selectedLogEntry.log_entry}</code>
                </div>
              </div>

              {selectedLogEntry.parsedData && Object.keys(selectedLogEntry.parsedData).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Parsed Information</h3>
                  <div className="bg-muted/50 p-4 rounded-md">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {Object.entries(selectedLogEntry.parsedData)
                        .filter(([key]) => !["host", "timestamp"].includes(key)) // Skip already displayed fields
                        .map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <dt className="text-xs font-medium text-muted-foreground capitalize">{key}</dt>
                            <dd className="text-sm">{value}</dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </div>
              )}

              {selectedLogEntry.parsedData?.service === "sudo" && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-amber-700 mb-2">Sudo Command Execution</h3>
                  <p className="text-sm text-amber-600">
                    This log entry records a sudo command execution, which grants elevated privileges.
                    {selectedLogEntry.parsedData?.command && (
                      <>
                        <br />
                        Command executed:{" "}
                        <code className="bg-amber-100 px-1 py-0.5 rounded">{selectedLogEntry.parsedData.command}</code>
                      </>
                    )}
                  </p>
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setModalOpen(false)
                        setTimeout(() => {
                          setCommandText(selectedLogEntry.parsedData?.command || "")
                          setSelectedRuleId("")
                          setAddToRuleDialogOpen(true)
                        }, 100)
                      }}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add to Rule
                    </Button>
                  </div>
                </div>
              )}

              {selectedLogEntry.parsedData?.sessionStatus && (
                <div
                  className={`bg-${selectedLogEntry.parsedData.sessionStatus === "opened" ? "green" : "red"}-50 border border-${selectedLogEntry.parsedData.sessionStatus === "opened" ? "green" : "red"}-200 p-4 rounded-md`}
                >
                  <h3
                    className={`text-sm font-medium text-${selectedLogEntry.parsedData.sessionStatus === "opened" ? "green" : "red"}-700 mb-2`}
                  >
                    Session{" "}
                    {selectedLogEntry.parsedData.sessionStatus.charAt(0).toUpperCase() +
                      selectedLogEntry.parsedData.sessionStatus.slice(1)}
                  </h3>
                  <p
                    className={`text-sm text-${selectedLogEntry.parsedData.sessionStatus === "opened" ? "green" : "red"}-600`}
                  >
                    This log entry records a session being {selectedLogEntry.parsedData.sessionStatus}
                    {selectedLogEntry.parsedData.sessionUser && ` for user ${selectedLogEntry.parsedData.sessionUser}`}.
                  </p>
                </div>
              )}

              {/* Add matched rules section if any */}
              {matchedCommands.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-blue-700">Matching Rules</h3>
                  </div>
                  <p className="text-sm text-blue-600 mb-2">
                    This log entry matches commands from the following rules:
                  </p>
                  <div className="space-y-1">
                    {matchedCommands.map((cmd, index) => (
                      <div key={index} className="text-xs bg-blue-100 p-2 rounded">
                        <code>{cmd}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedLogEntry && selectedLogEntry.parsedData?.command && (
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false)
                  setTimeout(() => {
                    setCommandText(selectedLogEntry.parsedData?.command || "")
                    setSelectedRuleId("")
                    setAddToRuleDialogOpen(true)
                  }, 100)
                }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add to Rule
              </Button>
            )}
            <Button onClick={() => setModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Rule Dialog */}
      <Dialog open={addToRuleDialogOpen} onOpenChange={setAddToRuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-blue-500" />
              Add Command to Rule
            </DialogTitle>
            <DialogDescription>Add this command to an existing rule for monitoring and automation.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rule-select">Select Rule</Label>
              <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a rule" />
                </SelectTrigger>
                <SelectContent>
                  {ruleGroups.map((group) => (
                    <React.Fragment key={group.id}>
                      {group.rules.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{group.name}</div>
                          {group.rules.map((rule: Rule) => (
                            <SelectItem key={rule.id} value={rule.id.toString()}>
                              {rule.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="command-text">Command</Label>
              <Input
                id="command-text"
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                placeholder="Enter command text"
              />
              <p className="text-xs text-muted-foreground">
                Edit the command if needed to match the pattern you want to monitor.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCommandToRule}
              disabled={!selectedRuleId || !commandText.trim() || isAddingCommand}
            >
              {isAddingCommand ? "Adding..." : "Add Command"}
            </Button>
          </DialogFooter>
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
                  You are about to delete ALL auth logs. This action cannot be undone.
                </span>
              ) : (
                <>
                  You are about to delete all auth logs older than{" "}
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

      {/* Display matched commands if any */}
      {matchedCommands.length > 0 && (
        <div className="mt-4 p-4 border rounded-md bg-muted/20">
          <h3 className="text-sm font-medium mb-2">Matching Commands</h3>
          <div className="space-y-2">
            {matchedCommands.map((cmd, index) => (
              <div key={index} className="text-xs bg-muted p-2 rounded">
                <code>{cmd}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

