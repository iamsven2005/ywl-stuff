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
import { Badge } from "@/components/ui/badge"
import { Check, ChevronDown, RefreshCw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getLogs, deleteMultipleLogs } from "./actions"

// Debounce function to limit how often a function can run
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Host options for filtering
const hostOptions = [
  { label: "All Devices", value: "all" },
  { label: "VM01", value: "vm01" },
  { label: "VM02", value: "vm02" },
]

export default function LogsTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedHosts, setSelectedHosts] = useState<string[]>(["all"])
  const [selectedLogs, setSelectedLogs] = useState<number[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Apply debounced search
  const debouncedSearch = debounce((value: string) => {
    setDebouncedSearchQuery(value)
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

      const fetchedLogs = await getLogs({
        search: debouncedSearchQuery,
        hosts,
      })

      setLogs(fetchedLogs)
    } catch (error) {
      toast.error("Failed to fetch logs")
    } finally {
      setIsLoading(false)
    }
  }

  // Load logs when filters change
  useEffect(() => {
    fetchLogs()
  }, [debouncedSearchQuery, selectedHosts])

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
    // No need to call fetchLogs here as it will be triggered by the useEffect
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
        </div>

        <div className="flex gap-2">
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

          {selectedLogs.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete ({selectedLogs.length})
            </Button>
          )}
        </div>
      </div>

      {selectedHosts.length > 0 && !selectedHosts.includes("all") && (
        <div className="flex flex-wrap gap-2">
          {selectedHosts.map((host) => (
            <Badge key={host} variant="secondary" className="gap-1">
              {hostOptions.find((h) => h.value === host)?.label}
              <button onClick={() => handleHostSelect(host)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                ×
              </button>
            </Badge>
          ))}
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
              <TableHead>Name</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
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
                  <TableCell>{log.name}</TableCell>
                  <TableCell>
                    {log.host ? (
                      <Badge variant="outline">{log.host}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

