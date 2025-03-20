"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Clock, User, Info, RefreshCw, Filter, Calendar } from "lucide-react"
import { format } from "date-fns"
import { getCurrentUserActivityLogs, getAllActivityTypes, getAllTargetTypes } from "@/lib/activity-logger"

export default function ActivityLogsTable() {
  const [logs, setLogs] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [actionTypes, setActionTypes] = useState<string[]>([])
  const [targetTypes, setTargetTypes] = useState<string[]>([])

  // Filters
  const [actionType, setActionType] = useState<string>("all")
  const [targetType, setTargetType] = useState<string>("all")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [dateRange, setDateRange] = useState<string>("all")

  useEffect(() => {
    const fetchActivityTypes = async () => {
      const actions = await getAllActivityTypes()
      const targets = await getAllTargetTypes()
      setActionTypes(actions)
      setTargetTypes(targets)
    }

    fetchActivityTypes()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [actionType, targetType, page, dateRange])

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const result = await getCurrentUserActivityLogs({
        actionType: actionType !== "all" ? actionType : undefined,
        targetType: targetType !== "all" ? targetType : undefined,
        page,
        pageSize,
      });
  
      if (result) {
        setLogs(result.logs);
        setTotalCount(result.totalCount);
        setPageCount(result.pageCount);
      } else {
        // Handle null case
        setLogs([]);
        setTotalCount(0);
        setPageCount(1);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setLogs([]);
      setTotalCount(0);
      setPageCount(1);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleFilterChange = () => {
    setPage(1) // Reset to first page when filters change
  }

  const getActionTypeColor = (type: string) => {
    if (type.toLowerCase().includes("create")) return "bg-green-500"
    if (type.toLowerCase().includes("update")) return "bg-blue-500"
    if (type.toLowerCase().includes("delete")) return "bg-red-500"
    if (type.toLowerCase().includes("assign")) return "bg-purple-500"
    if (type.toLowerCase().includes("remove")) return "bg-orange-500"
    if (type.toLowerCase().includes("import")) return "bg-cyan-500"
    return "bg-gray-500"
  }

  const getTargetTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "user":
        return "bg-purple-500"
      case "device":
        return "bg-orange-500"
      case "rule":
        return "bg-yellow-500"
      case "rulegroup":
        return "bg-cyan-500"
      case "note":
        return "bg-pink-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-2xl font-bold">Activity Logs</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <Select
              value={actionType}
              onValueChange={(value) => {
                setActionType(value)
                handleFilterChange()
              }}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by action" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select
              value={targetType}
              onValueChange={(value) => {
                setTargetType(value)
                handleFilterChange()
              }}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by target" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                {targetTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select
              value={dateRange}
              onValueChange={(value) => {
                setDateRange(value)
                handleFilterChange()
              }}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue placeholder="Date range" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No activity logs found</div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="hidden md:table-cell">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {log.user.username}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getActionTypeColor(log.actionType)} text-white`}>{log.actionType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={`${getTargetTypeColor(log.targetType)} text-white`}>{log.targetType}</Badge>
                          {log.targetId && <span className="text-xs text-muted-foreground">ID: {log.targetId}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm">{log.details || "No details provided"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {logs.length} of {totalCount} results
              </div>

              <Pagination>
                <PaginationContent>
                {page > 1 && (
                    <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                    </PaginationItem>
                    )}


                  {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                    const pageNumber = page <= 3 ? i + 1 : page >= pageCount - 2 ? pageCount - 4 + i : page - 2 + i

                    if (pageNumber <= 0 || pageNumber > pageCount) return null

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink isActive={page === pageNumber} onClick={() => handlePageChange(pageNumber)}>
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                    {page < pageCount && (
                    <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(page + 1)} />
                    </PaginationItem>
                    )}

                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

