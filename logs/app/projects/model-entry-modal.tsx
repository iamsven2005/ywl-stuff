"use client"

import { Dialog } from "@/components/ui/dialog"
import { DialogFooter } from "@/components/ui/dialog"
import { DialogTitle } from "@/components/ui/dialog"
import { DialogHeader } from "@/components/ui/dialog"
import { DialogContent } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createModelEntry, updateModelEntry, deleteModelEntry, getModelEntries } from "./actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllUsersForPermissions } from "./actions"
import { Loader2, Trash2, Edit } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ModelEntry, User } from "@prisma/client"

interface ModelEntryModalProps {
  projectId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const formSchema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  createBy: z.string().min(1, "Creator is required"),
})

type FormValues = z.infer<typeof formSchema>

export function ModelEntryModal({ projectId, isOpen, onClose, onSuccess }: ModelEntryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [modelEntries, setModelEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
  const [parsedHtml, setParsedHtml] = useState<Document | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      description: "",
      createBy: "",
    },
  })

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      fetchModelEntries()
    }
  }, [isOpen, projectId])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const { users } = await getAllUsersForPermissions()
      setUsers(users)
    } catch (error) {
      toast.error("Failed to load users")
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchModelEntries = async () => {
    try {
      setLoadingEntries(true)
      const entries = await getModelEntries(projectId)
      setModelEntries(entries)
    } catch (error) {
      toast.error("Failed to load model entries")
    } finally {
      setLoadingEntries(false)
    }
  }

  const handleEdit = (entry: any) => {
    setEditingEntryId(entry.id)
    form.setValue("code", entry.code)
    form.setValue("description", entry.description || "")
    form.setValue("createBy", entry.createBy)
  }

  const handleCancelEdit = () => {
    setEditingEntryId(null)
    form.reset()
  }

  const handleUpdate = async (data: FormValues) => {
    if (!editingEntryId) return

    try {
      setIsSubmitting(true)
      await updateModelEntry(editingEntryId, {
        code: data.code,
        description: data.description,
      })
      toast.success("Model entry updated successfully")
      fetchModelEntries()
      setEditingEntryId(null)
    } catch (error) {
      toast.error("Failed to update model entry")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteModelEntry(id)
      toast.success("Model entry deleted successfully")
      fetchModelEntries()
    } catch (error) {
      toast.error("Failed to delete model entry")
    }
  }

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      await createModelEntry({
        projectId,
        code: values.code,
        description: values.description || "",
        createBy: values.createBy,
      })
      toast.success("Model entry created successfully")
      fetchModelEntries()
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating model entry:", error)
      toast.error("Failed to create model entry")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredModelEntries = modelEntries.filter((entry: ModelEntry) =>
    entry.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
  
    const reader = new FileReader()
    reader.onload = () => {
      const htmlString = reader.result as string
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlString, "text/html")
      setParsedHtml(doc)
      toast.success("HTML file loaded and parsed.")
    }
    reader.onerror = () => {
      toast.error("Failed to read file.")
    }
    reader.readAsText(file)
  }
  
  const handleImportFromHTML = async () => {
    if (!parsedHtml) return
  
    try {
      const entries: { code: string; description: string; createBy: string }[] = []
  
      const codes = Array.from(parsedHtml.querySelectorAll('input[name="modelCode"]'))
      const descs = Array.from(parsedHtml.querySelectorAll('input[name="modelDesc"]'))
      const users = Array.from(parsedHtml.querySelectorAll('input[name="modelCreUsr"]'))
  
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i]?.getAttribute("value") || ""
        const description = descs[i]?.getAttribute("value") || ""
        const createBy = users[i]?.nextSibling?.textContent?.trim() || "unknown"
  
        if (code && createBy) {
          entries.push({ code, description, createBy })
        }
      }
  
      if (entries.length === 0) {
        toast.error("No valid entries found.")
        return
      }
  
      setIsSubmitting(true)
      for (const entry of entries) {
        await createModelEntry({
          projectId,
          code: entry.code,
          description: entry.description,
          createBy: entry.createBy,
        })
      }
  
      toast.success(`${entries.length} entries imported successfully`)
      fetchModelEntries()
      onSuccess()
      setParsedHtml(null)
    } catch (error) {
      console.error("Error importing model entries:", error)
      toast.error("Failed to import model entries")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add Model Entry</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bug fixing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter description" className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="createBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Created By</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingUsers ? (
                        <SelectItem value="loading">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading users...
                        </SelectItem>
                      ) : (
                        users.map((user: User) => (
                          <SelectItem key={user.id} value={user.username}>
                            {user.username}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        <div className="space-y-4">
  <div>
    <label>Upload HTML File</label>
    <Input type="file" accept=".html,text/html" onChange={handleFileUpload} />
  </div>

  <div>
    <label>Or paste HTML content</label>
    <Textarea
      placeholder="Paste raw HTML source here..."
      className="min-h-[120px]"
      onChange={(e) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(e.target.value, "text/html")
        setParsedHtml(doc)
      }}
    />
  </div>

  <div>
    <Button variant="secondary" onClick={handleImportFromHTML} disabled={!parsedHtml}>
      Import Entries from HTML
    </Button>
  </div>
</div>


        {/* Display existing model entries */}
        <div className="mt-6">
          <h3 className="text-lg font-medium">Existing Model Entries</h3>
          <Input
            type="search"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
          {loadingEntries ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredModelEntries.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">No model entries found.</div>
          ) : (
            <ScrollArea className="h-72 w-190 rounded-md border">
                      <ScrollBar orientation="horizontal" />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModelEntries.map((entry: ModelEntry
                  ) => (
                    <TableRow key={entry.id}>
                      <TableCell className="max-w-[200px] whitespace-normal break-words">{entry.code}</TableCell>
                      <TableCell className="max-w-[200px] whitespace-normal break-words">{entry.description}</TableCell>
                      <TableCell>{entry.createBy}</TableCell>
                      <TableCell className="text-right">
                        {editingEntryId === entry.id ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                form.handleSubmit(handleUpdate)(form.getValues())
                                handleCancelEdit()
                              }}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "Updating..." : "Update"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

