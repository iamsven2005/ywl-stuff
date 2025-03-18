"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import withAdminAuth from "@/components/with-admin-auth"
import {
  getAllNotificationsAdmin,
  createNotification,
  updateNotification,
  deleteNotification,
} from "@/app/actions/notification-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { format } from "date-fns"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "@/app/theme-toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Eye, Calendar } from "lucide-react"

interface Notification {
  id: number
  title: string
  content: string
  postDate: Date
  expiryDate: Date | null
  important: boolean
  readCount: number
}

function NotificationForm({
  notification,
  onSubmit,
  onCancel,
}: {
  notification?: Notification
  onSubmit: (data: any) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(notification?.title || "")
  const [content, setContent] = useState(notification?.content || "")
  const [expiryDate, setExpiryDate] = useState(
    notification?.expiryDate ? format(new Date(notification.expiryDate), "yyyy-MM-dd") : "",
  )
  const [important, setImportant] = useState(notification?.important || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit({
        title,
        content,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        important,
      })
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={5} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
        <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="important" checked={important} onCheckedChange={setImportant} />
        <Label htmlFor="important">Mark as Important</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : notification ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}

function NotificationsAdminPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    try {
      setIsLoading(true)
      const data = await getAllNotificationsAdmin()
      setNotifications(data)
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNotification = async (data: any) => {
    try {
      const result = await createNotification(data)
      if (result.success) {
        toast.success("Notification created successfully")
        setIsCreateDialogOpen(false)
        loadNotifications()
      }
    } catch (error) {
      console.error("Error creating notification:", error)
      toast.error("Failed to create notification")
    }
  }

  const handleUpdateNotification = async (data: any) => {
    try {
      if (!editingNotification) return

      const result = await updateNotification(editingNotification.id, data)
      if (result.success) {
        toast.success("Notification updated successfully")
        setIsEditDialogOpen(false)
        setEditingNotification(null)
        loadNotifications()
      }
    } catch (error) {
      console.error("Error updating notification:", error)
      toast.error("Failed to update notification")
    }
  }

  const handleDeleteNotification = async (id: number) => {
    try {
      const result = await deleteNotification(id)
      if (result.success) {
        toast.success("Notification deleted successfully")
        loadNotifications()
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Notifications</h1>
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push("/logs")}>Back to Dashboard</Button>
          <ThemeToggle />
          <UserNav />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm">
          <Input
            type="search"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <Eye className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Notification</DialogTitle>
              <DialogDescription>Create a new notification to display on the notice board.</DialogDescription>
            </DialogHeader>
            <NotificationForm onSubmit={handleCreateNotification} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notice Board Entries</CardTitle>
          <CardDescription>Manage all notifications displayed on the notice board.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Post Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Important</TableHead>
                  <TableHead>Read Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell>{format(new Date(notification.postDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        {notification.expiryDate
                          ? format(new Date(notification.expiryDate), "MMM dd, yyyy")
                          : "No expiry"}
                      </TableCell>
                      <TableCell>
                        {notification.important ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Important
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            Standard
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{notification.readCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog
                            open={isEditDialogOpen && editingNotification?.id === notification.id}
                            onOpenChange={(open) => {
                              setIsEditDialogOpen(open)
                              if (!open) setEditingNotification(null)
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingNotification(notification)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Edit Notification</DialogTitle>
                                <DialogDescription>Make changes to the notification.</DialogDescription>
                              </DialogHeader>
                              {editingNotification && (
                                <NotificationForm
                                  notification={editingNotification}
                                  onSubmit={handleUpdateNotification}
                                  onCancel={() => {
                                    setIsEditDialogOpen(false)
                                    setEditingNotification(null)
                                  }}
                                />
                              )}
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this notification? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteNotification(notification.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No notifications found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default withAdminAuth(NotificationsAdminPage)

