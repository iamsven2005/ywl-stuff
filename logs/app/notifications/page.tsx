"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Search, Bell, Calendar, AlertTriangle, CheckCircle, Eye, Plus, Edit, Trash2, Users } from "lucide-react"
import { format } from "date-fns"
import {
  createNotification,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
  getNotifications,
  getAllNotificationsAdmin,
} from "@/app/actions/notification-actions"
import { toast } from "sonner"

interface NotificationBase {
  id: number
  title: string
  content: string
  postDate: Date
  expiryDate: Date | null
  important: boolean
}

interface UserNotification extends NotificationBase {
  read: boolean
}

interface AdminNotification extends NotificationBase {
  readCount: number
}

interface NotificationsClientProps {
  isAdmin: boolean
}

export default function NotificationsClient({ isAdmin }: NotificationsClientProps) {
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([])
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Form state for creating/editing notifications
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<AdminNotification | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formExpiryDate, setFormExpiryDate] = useState<Date | null>(null)
  const [formImportant, setFormImportant] = useState(false)


  useEffect(() => {
    fetchNotifications()
  }, [isAdmin])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      if (isAdmin) {
        const adminData = await getAllNotificationsAdmin()
        setAdminNotifications(adminData)
      } else {
        const userData = await getNotifications()
        setUserNotifications(userData)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast.error("Failed to load notifications. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Filter is done client-side
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id)

      // Update local state
      setUserNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )

      toast.success("Notification marked as read")
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const handleCreateNotification = async () => {
    try {
      await createNotification({
        title: formTitle,
        content: formContent,
        expiryDate: formExpiryDate,
        important: formImportant,
      })

      // Reset form and close dialog
      resetForm()
      setIsCreateDialogOpen(false)

      // Refresh notifications
      fetchNotifications()

      toast.success("Notification created successfully")
    } catch (error) {
      console.error("Error creating notification:", error)
      toast.error( "Failed to create notification")
    }
  }

  const handleUpdateNotification = async () => {
    if (!editingNotification) return

    try {
      await updateNotification(editingNotification.id, {
        title: formTitle,
        content: formContent,
        expiryDate: formExpiryDate,
        important: formImportant,
      })

      // Reset form and close dialog
      resetForm()
      setIsEditDialogOpen(false)

      // Refresh notifications
      fetchNotifications()

      toast.success( "Notification updated successfully")
    } catch (error) {
      console.error("Error updating notification:", error)
      toast.success("Failed to update notification")
    }
  }

  const handleDeleteNotification = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return

    try {
      await deleteNotification(id)

      // Refresh notifications
      fetchNotifications()

      toast.success("Notification deleted successfully")
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("Failed to delete notification")
    }
  }

  const openEditDialog = (notification: AdminNotification) => {
    setEditingNotification(notification)
    setFormTitle(notification.title)
    setFormContent(notification.content)
    setFormExpiryDate(notification.expiryDate)
    setFormImportant(notification.important)
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormTitle("")
    setFormContent("")
    setFormExpiryDate(null)
    setFormImportant(false)
    setEditingNotification(null)
  }

  // Filter notifications based on search and active tab
  const filteredUserNotifications = userNotifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "unread") return matchesSearch && !notification.read
    if (activeTab === "important") return matchesSearch && notification.important

    return matchesSearch
  })

  const filteredAdminNotifications = adminNotifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "important") return matchesSearch && notification.important

    return matchesSearch
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notice Board</h1>
        {isAdmin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Notice</DialogTitle>
                <DialogDescription>Create a new notice that will be visible to all users.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Notice title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Notice content"
                    rows={5}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <DatePicker />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="important"
                    checked={formImportant}
                    onCheckedChange={(checked) => setFormImportant(checked === true)}
                  />
                  <Label htmlFor="important">Mark as Important</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNotification}>Create Notice</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Notices</CardTitle>
          <CardDescription>Find specific notices</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notices..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Notices</TabsTrigger>
          {!isAdmin && (
            <TabsTrigger value="unread">
              Unread
              {userNotifications.filter((n) => !n.read).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {userNotifications.filter((n) => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="important">
            Important
            {(isAdmin
              ? adminNotifications.filter((n) => n.important).length
              : userNotifications.filter((n) => n.important).length) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {isAdmin
                  ? adminNotifications.filter((n) => n.important).length
                  : userNotifications.filter((n) => n.important).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : isAdmin ? (
            filteredAdminNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No notices found</p>
                </CardContent>
              </Card>
            ) : (
              filteredAdminNotifications.map((notification) => (
                <Card key={notification.id} className={notification.important ? "border-red-500" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        {notification.important && <Badge variant="destructive">Important</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(notification)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Posted: {format(new Date(notification.postDate), "MMM dd, yyyy")}
                      {notification.expiryDate && (
                        <span className="ml-3">
                          Expires: {format(new Date(notification.expiryDate), "MMM dd, yyyy")}
                        </span>
                      )}
                      <span className="ml-3 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        Read by: {notification.readCount} users
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{notification.content}</p>
                  </CardContent>
                </Card>
              ))
            )
          ) : filteredUserNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No notices found</p>
              </CardContent>
            </Card>
          ) : (
            filteredUserNotifications.map((notification) => (
              <Card key={notification.id} className={notification.important ? "border-red-500" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      {notification.important && <Badge variant="destructive">Important</Badge>}
                      {!notification.read && <Badge variant="secondary">New</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={notification.read}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {notification.read ? "Read" : "Mark as Read"}
                    </Button>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Posted: {format(new Date(notification.postDate), "MMM dd, yyyy")}
                    {notification.expiryDate && (
                      <span className="ml-3">Expires: {format(new Date(notification.expiryDate), "MMM dd, yyyy")}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{notification.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {!isAdmin && (
          <TabsContent value="unread" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredUserNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <CheckCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No unread notices</p>
                </CardContent>
              </Card>
            ) : (
              filteredUserNotifications.map((notification) => (
                <Card key={notification.id} className={notification.important ? "border-red-500" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        {notification.important && <Badge variant="destructive">Important</Badge>}
                        <Badge variant="secondary">New</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Mark as Read
                      </Button>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Posted: {format(new Date(notification.postDate), "MMM dd, yyyy")}
                      {notification.expiryDate && (
                        <span className="ml-3">
                          Expires: {format(new Date(notification.expiryDate), "MMM dd, yyyy")}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{notification.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}

        <TabsContent value="important" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : isAdmin ? (
            filteredAdminNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No important notices</p>
                </CardContent>
              </Card>
            ) : (
              filteredAdminNotifications.map((notification) => (
                <Card key={notification.id} className="border-red-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        <Badge variant="destructive">Important</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(notification)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Posted: {format(new Date(notification.postDate), "MMM dd, yyyy")}
                      {notification.expiryDate && (
                        <span className="ml-3">
                          Expires: {format(new Date(notification.expiryDate), "MMM dd, yyyy")}
                        </span>
                      )}
                      <span className="ml-3 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        Read by: {notification.readCount} users
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{notification.content}</p>
                  </CardContent>
                </Card>
              ))
            )
          ) : filteredUserNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No important notices</p>
              </CardContent>
            </Card>
          ) : (
            filteredUserNotifications.map((notification) => (
              <Card key={notification.id} className="border-red-500">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <Badge variant="destructive">Important</Badge>
                      {!notification.read && <Badge variant="secondary">New</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={notification.read}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {notification.read ? "Read" : "Mark as Read"}
                    </Button>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Posted: {format(new Date(notification.postDate), "MMM dd, yyyy")}
                    {notification.expiryDate && (
                      <span className="ml-3">Expires: {format(new Date(notification.expiryDate), "MMM dd, yyyy")}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{notification.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Notification Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription>Make changes to the existing notice.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Notice title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Notice content"
                rows={5}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-expiryDate">Expiry Date (Optional)</Label>
              <DatePicker />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-important"
                checked={formImportant}
                onCheckedChange={(checked) => setFormImportant(checked === true)}
              />
              <Label htmlFor="edit-important">Mark as Important</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNotification}>Update Notice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

