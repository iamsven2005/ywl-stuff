"use client"

import { Suspense, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LogsTable from "./logs-table"
import AuthLogsTable from "./auth-logs-table"
import UsageChart from "./usage-chart"
import MemoryUsageChart from "./memory-usage-chart"
import SensorChart from "./sensor-chart"
import DevicesTable from "./devices-table"
import NotesTable from "./notes-table"
import { LogsTableSkeleton } from "./logs-table-skeleton"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Download, RefreshCcw } from "lucide-react"

export default function LogsPage() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false);

  // Database Backup Function
  const handleBackupDatabase = async () => {
    setIsBackingUp(true)

    try {
      const response = await fetch("/api/backup", { method: "POST" })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || "Backup failed")

      toast.success("Database backup successful!", {
        description: data.filePath ? `Saved to: ${data.filePath}` : "Download available.",
      })

      // If backup is available for download, trigger a file download
      if (data.downloadUrl) {
        const link = document.createElement("a")
        link.href = data.downloadUrl
        link.download = data.fileName || "database_backup.sql"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Backup error:", error)
      toast.error("Database backup failed.")
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestoreDatabase = async () => {
    setIsRestoring(true);
    try {
      const response = await fetch("/api/restore", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Restore failed");

      toast.success("Database restored!", { description: `Restored from: ${data.latestBackup}` });
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("Restore failed.");
    } finally {
      setIsRestoring(false);
    }
  };
  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Logs</h1>
        <div className="flex gap-2">
          <Button onClick={handleBackupDatabase} disabled={isBackingUp}>
            {isBackingUp ? "Backing Up..." : "Backup Database"}
            <Download className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={handleRestoreDatabase} disabled={isRestoring} variant="destructive">
            {isRestoring ? "Restoring..." : "Restore Database"}
            <RefreshCcw className="ml-2 h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Suspense fallback={<div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-md"></div>}>
          <UsageChart />
        </Suspense>

        <Suspense fallback={<div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-md"></div>}>
          <MemoryUsageChart />
        </Suspense>

        <Suspense fallback={<div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-md"></div>}>
          <SensorChart />
        </Suspense>
      </div>

      <Tabs defaultValue="system-logs" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="system-logs">System Logs</TabsTrigger>
          <TabsTrigger value="auth-logs">Auth Logs</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="system-logs">
          <Suspense fallback={<LogsTableSkeleton />}>
            <LogsTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="auth-logs">
          <Suspense fallback={<LogsTableSkeleton />}>
            <AuthLogsTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="devices">
          <Suspense fallback={<LogsTableSkeleton />}>
            <DevicesTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="notes">
          <Suspense fallback={<LogsTableSkeleton />}>
            <NotesTable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
