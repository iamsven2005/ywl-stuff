"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, FileUp, FileDown, AlertCircle, Upload } from "lucide-react"
import { toast } from "sonner"
import { parseXMLTranscript, generateXMLTranscript, downloadXML } from "../utils/xml-utils"
import { importXMLMessages, getGroupMessagesWithDetails } from "../actions/chat-actions"

export function ImportExportDialog({
  open,
  onOpenChange,
  groupId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: number
}) {
  const [activeTab, setActiveTab] = useState("import")
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const processFile = async (file: File) => {
    try {
      setImporting(true)
      setImportError(null)

      // Check file type
      if (!file.name.endsWith(".xml")) {
        throw new Error("Only XML files are supported")
      }

      // Read file content
      const text = await file.text()

      // Parse XML
      const transcript = parseXMLTranscript(text)

      if (!transcript.messages || transcript.messages.length === 0) {
        throw new Error("No messages found in the XML file")
      }

      // Import messages
      const result = await importXMLMessages(groupId, transcript.messages)

      toast.success(`Successfully imported ${result.count} messages`)
      onOpenChange(false)
    } catch (error) {
      console.error("Import error:", error)
      setImportError(error instanceof Error ? error.message : "Failed to import XML file")
      toast.error("Failed to import XML file")
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length === 0) return

      const file = files[0]
      await processFile(file)
    },
    [groupId],
  )

  const handleExport = async () => {
    try {
      setExporting(true)

      // Fetch messages with sender/receiver details
      const messages = await getGroupMessagesWithDetails(groupId)

      if (!messages || messages.length === 0) {
        toast.warning("No messages to export")
        return
      }

      // Generate XML
      const xml = generateXMLTranscript(messages)

      // Download file
      downloadXML(xml, `chat-${groupId}-${new Date().toISOString().slice(0, 10)}.xml`)

      toast.success("Chat exported successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export chat")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Import/Export Chat</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Import chat history from XML or export this chat as XML
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700">
            <TabsTrigger value="import" className="dark:data-[state=active]:bg-gray-600 dark:text-gray-200">
              Import
            </TabsTrigger>
            <TabsTrigger value="export" className="dark:data-[state=active]:bg-gray-600 dark:text-gray-200">
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-4 space-y-4">
            <div className="text-sm dark:text-gray-300">
              Import chat history from an XML file. The file should follow the transcript format with messages
              containing to, from, body, and date elements.
            </div>

            {importError && (
              <Alert variant="destructive" className="dark:bg-red-900/20 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="dark:text-red-300">{importError}</AlertDescription>
              </Alert>
            )}

            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".xml" />

            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/10 dark:border-blue-500 dark:bg-blue-500/10"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-sm font-medium dark:text-gray-300">
                Drag and drop your XML file here, or{" "}
                <button
                  type="button"
                  onClick={handleFileSelect}
                  className="text-primary dark:text-blue-400 hover:underline"
                  disabled={importing}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only XML files are supported</p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleFileSelect}
                disabled={importing}
                className="dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4 mr-2" />
                    Select XML File
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="export" className="mt-4 space-y-4">
            <div className="text-sm dark:text-gray-300">
              Export this chat as an XML file. The export will include all messages in the chat with sender and
              timestamp information.
            </div>

            <div className="flex justify-center">
              <Button onClick={handleExport} disabled={exporting} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as XML
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

