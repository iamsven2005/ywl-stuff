"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ExportReportButton({ reportId, reportName }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format) => {
    setIsExporting(true)
    try {
      // In a real app, this would call an API endpoint to generate the report
      console.log(`Exporting ${reportName} in ${format} format`)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create a fake download link
      const link = document.createElement("a")
      link.href = "#"
      link.download = `${reportName.replace(/\s+/g, "_").toLowerCase()}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting report:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("pdf")}>PDF Document</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>Excel Spreadsheet</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>CSV File</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
