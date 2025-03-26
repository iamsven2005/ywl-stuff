"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Pencil, Trash2, Plus, Mail } from 'lucide-react'
import { EmailTemplateForm } from "../../components/email-template-form"
import { deleteEmailTemplate, getAllEmailTemplates } from "@/app/actions/email-template-actions"
import { User } from "@prisma/client"

interface AssignedUser {
  id: number;
  username: string;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  createdAt: string | Date; // Accept both Date and string
  updatedAt: string | Date;
  assignedUsers: AssignedUser[]; // Expect only id and username
}


export default function EmailTemplateTable() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const fetchedTemplates = await getAllEmailTemplates();
  
      if (!Array.isArray(fetchedTemplates)) {
        throw new Error("Invalid response format");
      }
  
      setTemplates(
        fetchedTemplates.map(template => ({
          ...template,
          assignedUsers: (template.assignedUsers || []).map((user: any) => ({
            id: user.userId, // ✅ rename userId to id
            username: user.username || "Unknown", // ✅ ensure username exists
          }))
        }))
      )
      ;
    } catch (error) {
      console.error("Error fetching email templates:", error);
      toast.error("Failed to load email templates");
    } finally {
      setIsLoading(false);
    }
  };
  
  // ✅ Run `fetchTemplates` when component mounts
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  
  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate({
      ...template,
      assignedUsers: template.assignedUsers || [], // Ensure it has an array
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle template deletion
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return
    
    try {
      const result = await deleteEmailTemplate(selectedTemplate.id)
      if (result.success) {
        toast.success("Email template deleted successfully")
        fetchTemplates()
      } else {
        toast.error("Failed to delete email template")
      }
    } catch (error: any) {
      console.error("Error deleting email template:", error)
      toast.error(error.message || "An error occurred while deleting the template")
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedTemplate(null)
    }
  }

  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };
  

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Manage email templates for alerts and notifications</CardDescription>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>
                Create a new email template that can be assigned to rules, groups, or commands.
              </DialogDescription>
            </DialogHeader>
            <EmailTemplateForm 
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                fetchTemplates()
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground mb-4">No email templates found</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Create your first template
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.subject}</TableCell>
                    <TableCell>{formatDate(template.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedTemplate(template)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedTemplate(template)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Template Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Edit Email Template</DialogTitle>
              <DialogDescription>
                Update the email template details.
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
  <EmailTemplateForm 
    template={selectedTemplate} // This now includes assignedUsers
    onSuccess={() => {
      setIsEditDialogOpen(false);
      fetchTemplates();
    }}
    onCancel={() => setIsEditDialogOpen(false)}
  />
)}

          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the email template "{selectedTemplate?.name}". 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedTemplate(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTemplate} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
