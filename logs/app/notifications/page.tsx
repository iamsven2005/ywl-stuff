"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Search, Bell, Calendar, AlertTriangle, CheckCircle, Eye } from "lucide-react"
import { format } from "date-fns"

interface Notification {
  id: number
  title: string
  content: string
  postDate: Date
  expiryDate: Date | null
  important: boolean
  read: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications")
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Filter is done client-side for now
  }

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      })

      if (response.ok) {
        // Update the local state
        setNotifications((prev) =>
          prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Filter notifications based on search and active tab
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.content.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "unread") return matchesSearch && !notification.read
    if (activeTab === "important") return matchesSearch && notification.important

    return matchesSearch
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notice Board</h1>
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
          <TabsTrigger value="unread">
            Unread
            {notifications.filter((n) => !n.read).length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notifications.filter((n) => !n.read).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="important">
            Important
            {notifications.filter((n) => n.important).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {notifications.filter((n) => n.important).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No notices found</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
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
                      onClick={() => markAsRead(notification.id)}
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

        <TabsContent value="unread" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CheckCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No unread notices</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card key={notification.id} className={notification.important ? "border-red-500" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      {notification.important && <Badge variant="destructive">Important</Badge>}
                      <Badge variant="secondary">New</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Mark as Read
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

        <TabsContent value="important" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No important notices</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
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
                      onClick={() => markAsRead(notification.id)}
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
    </div>
  )
}

