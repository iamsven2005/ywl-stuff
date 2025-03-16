"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Search,
  RefreshCw,
  Trash2,
  Edit,
  Plus,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileText,
  Terminal,
  X,
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { exportToExcel } from "../export-utils"
import {
  getRuleGroups,
  createRuleGroup,
  updateRuleGroup,
  deleteRuleGroup,
  createRule,
  updateRule,
  deleteRule,
  importRuleGroups,
} from "@/app/actions/rules-actions"

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

// Function to prepare rule groups for export - moved to client side
function prepareRuleGroupsForExport(ruleGroups: any[]) {
  const exportData: any[] = []

  ruleGroups.forEach((group) => {
    // Add the group as a row
    exportData.push({
      Type: "Group",
      ID: group.id,
      Name: group.name,
      Description: "",
      Command: "",
      GroupID: "",
      GroupName: "",
    })

    // Add each rule as a row
    group.rules.forEach((rule: any) => {
      exportData.push({
        Type: "Rule",
        ID: rule.id,
        Name: rule.name,
        Description: rule.description || "",
        Command: "",
        GroupID: group.id,
        GroupName: group.name,
      })

      // Add each command as a row
      rule.commands.forEach((cmd: any) => {
        exportData.push({
          Type: "Command",
          ID: cmd.id,
          Name: "",
          Description: "",
          Command: cmd.command,
          GroupID: group.id,
          GroupName: group.name,
          RuleID: rule.id,
          RuleName: rule.name,
        })
      })
    })
  })

  return exportData
}

export default function RulesTable() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedGroups, setSelectedGroups] = useState<number[]>([])
  const [ruleGroups, setRuleGroups] = useState<any[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Modal states
  const [addGroupModalOpen, setAddGroupModalOpen] = useState(false)
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false)
  const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false)
  const [addRuleModalOpen, setAddRuleModalOpen] = useState(false)
  const [editRuleModalOpen, setEditRuleModalOpen] = useState(false)
  const [deleteRuleModalOpen, setDeleteRuleModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<any | null>(null)
  const [currentRule, setCurrentRule] = useState<any | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)

  // Form states
  const [groupForm, setGroupForm] = useState({ name: "" })
  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    groupId: 0,
    commands: [""],
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

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

  // Fetch rule groups with filters
  const fetchRuleGroups = async () => {
    setIsLoading(true)
    try {
      const result = await getRuleGroups({
        search: debouncedSearchQuery,
        page: currentPage,
        pageSize: pageSize,
      })

      setRuleGroups(result.ruleGroups)
      setTotalPages(result.pageCount)
      setTotalItems(result.totalCount)
    } catch (error) {
      toast.error("Failed to fetch rule groups")
    } finally {
      setIsLoading(false)
    }
  }

  // Load rule groups when filters or pagination changes
  useEffect(() => {
    fetchRuleGroups()
  }, [debouncedSearchQuery, currentPage, pageSize])

  // Handle group selection
  const handleSelectGroup = (id: number) => {
    if (selectedGroups.includes(id)) {
      setSelectedGroups(selectedGroups.filter((groupId) => groupId !== id))
    } else {
      setSelectedGroups([...selectedGroups, id])
    }
  }

  // Handle select all groups
  const handleSelectAll = () => {
    if (selectedGroups.length === ruleGroups.length) {
      setSelectedGroups([])
    } else {
      setSelectedGroups(ruleGroups.map((group) => group.id))
    }
  }

  // Toggle group expansion
  const toggleGroupExpansion = (id: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
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

  // Open add group modal
  const openAddGroupModal = () => {
    setGroupForm({ name: "" })
    setAddGroupModalOpen(true)
  }

  // Open edit group modal
  const openEditGroupModal = (group: any) => {
    setCurrentGroup(group)
    setGroupForm({ name: group.name })
    setEditGroupModalOpen(true)
  }

  // Open delete group modal
  const openDeleteGroupModal = (group: any) => {
    setCurrentGroup(group)
    setDeleteGroupModalOpen(true)
  }

  // Open add rule modal
  const openAddRuleModal = (groupId: number) => {
    setRuleForm({
      name: "",
      description: "",
      groupId,
      commands: [""],
    })
    setAddRuleModalOpen(true)
  }

  // Open edit rule modal
  const openEditRuleModal = (rule: any) => {
    setCurrentRule(rule)
    setRuleForm({
      name: rule.name,
      description: rule.description || "",
      groupId: rule.groupId,
      commands: rule.commands.map((cmd: any) => cmd.command),
    })
    setEditRuleModalOpen(true)
  }

  // Open delete rule modal
  const openDeleteRuleModal = (rule: any) => {
    setCurrentRule(rule)
    setDeleteRuleModalOpen(true)
  }

  // Handle group form input change
  const handleGroupFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroupForm({ name: e.target.value })
  }

  // Handle rule form input change
  const handleRuleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setRuleForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle command input change
  const handleCommandChange = (index: number, value: string) => {
    const updatedCommands = [...ruleForm.commands]
    updatedCommands[index] = value
    setRuleForm((prev) => ({
      ...prev,
      commands: updatedCommands,
    }))
  }

  // Add a new command input field
  const addCommandField = () => {
    setRuleForm((prev) => ({
      ...prev,
      commands: [...prev.commands, ""],
    }))
  }

  // Remove a command input field
  const removeCommandField = (index: number) => {
    if (ruleForm.commands.length > 1) {
      const updatedCommands = [...ruleForm.commands]
      updatedCommands.splice(index, 1)
      setRuleForm((prev) => ({
        ...prev,
        commands: updatedCommands,
      }))
    }
  }

  // Handle add group
  const handleAddGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error("Group name is required")
      return
    }

    try {
      await createRuleGroup({ name: groupForm.name.trim() })
      toast.success("Rule group added successfully")
      setAddGroupModalOpen(false)
      fetchRuleGroups()
      router.refresh()
    } catch (error) {
      toast.error("Failed to add rule group")
    }
  }

  // Handle update group
  const handleUpdateGroup = async () => {
    if (!currentGroup || !groupForm.name.trim()) {
      toast.error("Group name is required")
      return
    }

    try {
      await updateRuleGroup({
        id: currentGroup.id,
        name: groupForm.name.trim(),
      })
      toast.success("Rule group updated successfully")
      setEditGroupModalOpen(false)
      fetchRuleGroups()
      router.refresh()
    } catch (error) {
      toast.error("Failed to update rule group")
    }
  }

  // Handle delete group
  const handleDeleteGroup = async () => {
    if (!currentGroup) return

    try {
      await deleteRuleGroup(currentGroup.id)
      toast.success("Rule group deleted successfully")
      setDeleteGroupModalOpen(false)
      fetchRuleGroups()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete rule group")
    }
  }

  // Handle add rule
  const handleAddRule = async () => {
    if (!ruleForm.name.trim()) {
      toast.error("Rule name is required")
      return
    }

    if (!ruleForm.commands.some((cmd) => cmd.trim())) {
      toast.error("At least one command is required")
      return
    }

    try {
      await createRule({
        name: ruleForm.name.trim(),
        description: ruleForm.description.trim() || undefined,
        groupId: ruleForm.groupId,
        commands: ruleForm.commands.filter((cmd) => cmd.trim()),
      })
      toast.success("Rule added successfully")
      setAddRuleModalOpen(false)
      fetchRuleGroups()
      router.refresh()
    } catch (error) {
      toast.error("Failed to add rule")
    }
  }

  // Handle update rule
  const handleUpdateRule = async () => {
    if (!currentRule || !ruleForm.name.trim()) {
      toast.error("Rule name is required")
      return
    }

    if (!ruleForm.commands.some((cmd) => cmd.trim())) {
      toast.error("At least one command is required")
      return
    }

    try {
      await updateRule({
        id: currentRule.id,
        name: ruleForm.name.trim(),
        description: ruleForm.description.trim() || undefined,
        groupId: ruleForm.groupId,
        commands: ruleForm.commands.filter((cmd) => cmd.trim()),
      })
      toast.success("Rule updated successfully")
      setEditRuleModalOpen(false)
      fetchRuleGroups()
      router.refresh()
    } catch (error) {
      toast.error("Failed to update rule")
    }
  }

  // Handle delete rule
  const handleDeleteRule = async () => {
    if (!currentRule) return

    try {
      await deleteRule(currentRule.id)
      toast.success("Rule deleted successfully")
      setDeleteRuleModalOpen(false)
      fetchRuleGroups()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete rule")
    }
  }

  // Handle delete selected groups
  const handleDeleteSelected = async () => {
    if (!selectedGroups.length) return

    try {
      await Promise.all(selectedGroups.map((id) => deleteRuleGroup(id)))
      toast.success(`Deleted ${selectedGroups.length} rule groups`)
      setSelectedGroups([])
      fetchRuleGroups()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete rule groups")
    }
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
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  // Export rules to Excel - now using client-side function
  const handleExport = () => {
    if (ruleGroups.length === 0) {
      toast.error("No data to export")
      return
    }

    try {
      const exportData = prepareRuleGroupsForExport(ruleGroups)
      exportToExcel(exportData, `rules-export-${new Date().toISOString().split("T")[0]}`)
      toast.success("Rules exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export rules")
    }
  }

  // Handle file change for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)

    // Read the file to preview
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const binaryStr = evt.target?.result
        const workbook = XLSX.read(binaryStr, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)

        // Preview the first 5 rows
        setImportPreview(data.slice(0, 5))
      } catch (error) {
        console.error("Error reading Excel file:", error)
        toast.error("Failed to read Excel file")
      }
    }
    reader.readAsBinaryString(file)
  }

  // Import rules from Excel
  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file to import")
      return
    }

    setIsImporting(true)
    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const binaryStr = evt.target?.result
          const workbook = XLSX.read(binaryStr, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const data = XLSX.utils.sheet_to_json(worksheet)

          // Convert data to plain objects before passing to server action
          const plainData = JSON.parse(JSON.stringify(data))
          await importRuleGroups(plainData)

          toast.success("Rules imported successfully")
          fetchRuleGroups()
          router.refresh()
          setImportModalOpen(false)
        } catch (error) {
          console.error("Error processing Excel file:", error)
          toast.error("Failed to process Excel file")
        } finally {
          setIsImporting(false)
        }
      }
      reader.readAsBinaryString(importFile)
    } catch (error) {
      console.error("Import error:", error)
      toast.error("Failed to import rules")
      setIsImporting(false)
    }
  }

  // Generate template for rule import
  const generateRuleImportTemplate = () => {
    const template = [
      {
        Type: "Group",
        ID: "",
        Name: "Clock",
        Description: "",
        Command: "",
        GroupID: "",
        GroupName: "",
      },
      {
        Type: "Rule",
        ID: "",
        Name: "Start Clock",
        Description: "Commands to start the clock application",
        Command: "",
        GroupID: "",
        GroupName: "Clock",
      },
      {
        Type: "Command",
        ID: "",
        Name: "",
        Description: "",
        Command: "open /Applications/Clock.app",
        GroupID: "",
        GroupName: "Clock",
        RuleID: "",
        RuleName: "Start Clock",
      },
      {
        Type: "Command",
        ID: "",
        Name: "",
        Description: "",
        Command: 'echo "Clock application started"',
        GroupID: "",
        GroupName: "Clock",
        RuleID: "",
        RuleName: "Start Clock",
      },
      {
        Type: "Rule",
        ID: "",
        Name: "Stop Clock",
        Description: "Commands to stop the clock application",
        Command: "",
        GroupID: "",
        GroupName: "Clock",
      },
      {
        Type: "Command",
        ID: "",
        Name: "",
        Description: "",
        Command: "killall Clock",
        GroupID: "",
        GroupName: "Clock",
        RuleID: "",
        RuleName: "Stop Clock",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rules")

    // Generate Excel file
    XLSX.writeFile(workbook, "rules-import-template.xlsx")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rules..."
              className="pl-8 w-[200px] sm:w-[300px]"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchRuleGroups()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={openAddGroupModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Group
          </Button>

          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>

          {selectedGroups.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete ({selectedGroups.length})
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={ruleGroups.length > 0 && selectedGroups.length === ruleGroups.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[250px]">Name</TableHead>
              <TableHead>Rules</TableHead>
              <TableHead className="w-[180px]">Updated</TableHead>
              <TableHead className="w-[180px]">Created</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ruleGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No rule groups found.
                </TableCell>
              </TableRow>
            ) : (
              ruleGroups.map((group) => (
                <React.Fragment key={group.id}>
                  <TableRow>
                    <TableCell>
                      <Checkbox
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={() => handleSelectGroup(group.id)}
                      />
                    </TableCell>
                    <TableCell>{group.id}</TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleGroupExpansion(group.id)}
                      >
                        {expandedGroups[group.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{group.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{group.rules.length} rules</Badge>
                    </TableCell>
                    <TableCell>{formatDate(group.updatedAt)}</TableCell>
                    <TableCell>{formatDate(group.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openAddRuleModal(group.id)} title="Add Rule">
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditGroupModal(group)}
                          title="Edit Group"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteGroupModal(group)}
                          title="Delete Group"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedGroups[group.id] && group.rules.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0 border-t-0">
                        <div className="pl-12 pr-4 py-2 bg-muted/20">
                          <div className="rounded-md border bg-background">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[60px]">ID</TableHead>
                                  <TableHead className="w-[200px]">Rule Name</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="w-[100px]">Commands</TableHead>
                                  <TableHead className="w-[120px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.rules.map((rule: any) => (
                                  <TableRow key={rule.id}>
                                    <TableCell>{rule.id}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-green-500" />
                                        <span className="font-medium">{rule.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {rule.description || <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell>
                                      <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="commands" className="border-none">
                                          <AccordionTrigger className="py-1 px-2">
                                            <Badge variant="outline">{rule.commands.length} commands</Badge>
                                          </AccordionTrigger>
                                          <AccordionContent>
                                            <div className="space-y-2 mt-2">
                                              {rule.commands.map((cmd: any) => (
                                                <div key={cmd.id} className="flex items-center gap-2 text-sm">
                                                  <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                                                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                                    {cmd.command}
                                                  </code>
                                                </div>
                                              ))}
                                            </div>
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => openEditRuleModal(rule)}
                                          title="Edit Rule"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => openDeleteRuleModal(rule)}
                                          title="Delete Rule"
                                          className="text-red-500 hover:text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {ruleGroups.length} of {totalItems} results
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

      {/* Add Group Modal */}
      <Dialog open={addGroupModalOpen} onOpenChange={setAddGroupModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Rule Group</DialogTitle>
            <DialogDescription>Create a new group to organize related rules.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="group-name"
                value={groupForm.name}
                onChange={handleGroupFormChange}
                className="col-span-3"
                placeholder="e.g., Clock"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGroupModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGroup}>Add Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Modal */}
      <Dialog open={editGroupModalOpen} onOpenChange={setEditGroupModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Rule Group</DialogTitle>
            <DialogDescription>Update the rule group details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-group-name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-group-name"
                value={groupForm.name}
                onChange={handleGroupFormChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroupModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup}>Update Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Modal */}
      <Dialog open={deleteGroupModalOpen} onOpenChange={setDeleteGroupModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule group "{currentGroup?.name}"? This will also delete all rules and
              commands in this group. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGroupModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rule Modal */}
      <Dialog open={addRuleModalOpen} onOpenChange={setAddRuleModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Rule</DialogTitle>
            <DialogDescription>Create a new rule with commands.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rule-name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rule-name"
                name="name"
                value={ruleForm.name}
                onChange={handleRuleFormChange}
                className="col-span-3"
                placeholder="e.g., Start Clock"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="rule-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="rule-description"
                name="description"
                value={ruleForm.description}
                onChange={handleRuleFormChange}
                className="col-span-3"
                placeholder="Describe what this rule does"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Commands <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-2">
                {ruleForm.commands.map((cmd, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={cmd}
                      onChange={(e) => handleCommandChange(index, e.target.value)}
                      placeholder="Enter command"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCommandField(index)}
                      disabled={ruleForm.commands.length === 1}
                      title="Remove Command"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addCommandField} className="mt-2">
                  Add Command
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRule}>Add Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Modal */}
      <Dialog open={editRuleModalOpen} onOpenChange={setEditRuleModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
            <DialogDescription>Update the rule details and commands.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-rule-name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-rule-name"
                name="name"
                value={ruleForm.name}
                onChange={handleRuleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-rule-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="edit-rule-description"
                name="description"
                value={ruleForm.description}
                onChange={handleRuleFormChange}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Commands <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-2">
                {ruleForm.commands.map((cmd, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={cmd}
                      onChange={(e) => handleCommandChange(index, e.target.value)}
                      placeholder="Enter command"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCommandField(index)}
                      disabled={ruleForm.commands.length === 1}
                      title="Remove Command"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addCommandField} className="mt-2">
                  Add Command
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRule}>Update Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Rule Confirmation Modal */}
      <Dialog open={deleteRuleModalOpen} onOpenChange={setDeleteRuleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule "{currentRule?.name}"? This will also delete all commands in this
              rule. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRule}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Rules Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Rules</DialogTitle>
            <DialogDescription>
              Upload an Excel file to import rule groups, rules, and commands. The file should follow the template
              format.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="import-file">Excel File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              <p className="text-sm text-muted-foreground">Supported formats: .xlsx, .xls</p>
            </div>

            {importPreview.length > 0 && (
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2">Preview (first 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(importPreview[0]).map((key) => (
                          <th key={key} className="text-left p-2">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, index) => (
                        <tr key={index} className="border-b">
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="p-2">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button variant="outline" onClick={generateRuleImportTemplate} disabled={isImporting}>
              Download Template
            </Button>
            <Button onClick={handleImport} disabled={!importFile || isImporting}>
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Rules"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

