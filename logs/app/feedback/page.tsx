"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquareIcon, SendIcon, InboxIcon, PlusCircleIcon, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser } from "../login/actions"
import FeedbackForm from "./feedback-form"
import { toast } from "sonner"
import { getReceivedFeedback, getSentFeedback, markFeedbackAsRead } from "../actions/feedback-actions"

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [user, setUser] = useState<any>(null)
  const [isManager, setIsManager] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sentFeedback, setSentFeedback] = useState<any[]>([])
  const [receivedFeedback, setReceivedFeedback] = useState<any[]>([])
  const [loadingSent, setLoadingSent] = useState(false)
  const [loadingReceived, setLoadingReceived] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkUserRole() {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/login")
          return
        }
        setUser(currentUser)
        setIsManager(currentUser.role.includes("manager") || currentUser.role.includes("admin"))
        setIsLoading(false)
      } catch (error) {
        console.error("Error checking user role:", error)
        router.push("/login")
      }
    }

    checkUserRole()
  }, [router])

  useEffect(() => {
    if (activeTab === "sent" && user) {
      loadSentFeedback()
    } else if (activeTab === "received" && user && isManager) {
      loadReceivedFeedback()
    }
  }, [activeTab, user, isManager])

  async function loadSentFeedback() {
    if (loadingSent) return
    setLoadingSent(true)
    try {
      const result = await getSentFeedback()
      if (result.success) {
        setSentFeedback(result.feedback || [])
      } else {
        toast.error(result.error || "Failed to load sent feedback")
      }
    } catch (error) {
      console.error("Error loading sent feedback:", error)
      toast.error("Failed to load sent feedback")
    } finally {
      setLoadingSent(false)
    }
  }

  async function loadReceivedFeedback() {
    if (loadingReceived) return
    setLoadingReceived(true)
    try {
      const result = await getReceivedFeedback()
      if (result.success) {
        setReceivedFeedback(result.feedback || [])
      } else {
        toast.error(result.error || "Failed to load received feedback")
      }
    } catch (error) {
      console.error("Error loading received feedback:", error)
      toast.error("Failed to load received feedback")
    } finally {
      setLoadingReceived(false)
    }
  }

  async function handleMarkAsRead(feedbackId: string) {
    try {
      const result = await markFeedbackAsRead(feedbackId)
      if (result.success) {
        // Update the local state to mark the feedback as read
        setReceivedFeedback((prev) =>
          prev.map((item) => (item.id === Number(feedbackId) ? { ...item, isRead: true } : item)),
        )
        toast.success("Feedback marked as read")
      } else {
        toast.error(result.error || "Failed to mark feedback as read")
      }
    } catch (error) {
      console.error("Error marking feedback as read:", error)
      toast.error("Failed to mark feedback as read")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading feedback system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Feedback System</h1>
          <p className="text-muted-foreground text-lg">Submit and manage feedback across your organization</p>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <MessageSquareIcon className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <PlusCircleIcon className="h-4 w-4" />
              <span className="hidden md:inline">New Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <SendIcon className="h-4 w-4" />
              <span className="hidden md:inline">Sent</span>
            </TabsTrigger>
            {isManager && (
              <TabsTrigger value="received" className="flex items-center gap-2">
                <InboxIcon className="h-4 w-4" />
                <span className="hidden md:inline">Received</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircleIcon className="h-5 w-5 text-primary" />
                    New Feedback
                  </CardTitle>
                  <CardDescription>Submit new feedback to managers</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  <p className="text-sm text-muted-foreground">
                    Create detailed feedback for any manager in the system. Your feedback can include a subject and
                    detailed message.
                  </p>
                </CardContent>
                <div className="px-6 pb-4">
                  <Button onClick={() => setActiveTab("new")} className="w-full">
                    <PlusCircleIcon className="mr-2 h-4 w-4" />
                    Create New Feedback
                  </Button>
                </div>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <SendIcon className="h-5 w-5 text-primary" />
                    Sent Feedback
                  </CardTitle>
                  <CardDescription>View feedback you've submitted</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  <p className="text-sm text-muted-foreground">
                    Review all feedback you've sent to managers. Track which managers have read your feedback and when
                    it was submitted.
                  </p>
                </CardContent>
                <div className="px-6 pb-4">
                  <Button variant="outline" onClick={() => setActiveTab("sent")} className="w-full">
                    <SendIcon className="mr-2 h-4 w-4" />
                    View Sent Feedback
                  </Button>
                </div>
              </Card>

              {isManager && (
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <InboxIcon className="h-5 w-5 text-primary" />
                      Received Feedback
                    </CardTitle>
                    <CardDescription>View feedback sent to you</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-2">
                    <p className="text-sm text-muted-foreground">
                      As a manager, you can view all feedback submitted to you. Mark items as read once you've reviewed
                      them.
                    </p>
                  </CardContent>
                  <div className="px-6 pb-4">
                    <Button variant="outline" onClick={() => setActiveTab("received")} className="w-full">
                      <InboxIcon className="mr-2 h-4 w-4" />
                      View Received Feedback
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            <div className="mt-8 p-6 bg-muted rounded-lg">
              <h2 className="text-xl font-semibold mb-3 flex items-center">
                <MessageSquareIcon className="mr-2 h-5 w-5 text-primary" />
                About the Feedback System
              </h2>
              <p className="text-muted-foreground mb-4">
                Our feedback system allows employees to provide constructive feedback to managers in a structured
                format. All feedback is private and can only be viewed by the sender and the intended recipients.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-card p-4 rounded-md">
                  <h3 className="font-medium mb-2">For Employees</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Submit feedback to any manager</li>
                    <li>Track which managers have read your feedback</li>
                    <li>Maintain a history of all submitted feedback</li>
                  </ul>
                </div>
                <div className="bg-card p-4 rounded-md">
                  <h3 className="font-medium mb-2">For Managers</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Receive feedback from team members</li>
                    <li>Mark feedback as read once reviewed</li>
                    <li>Organize feedback by date and sender</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="new">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Submit New Feedback</h2>
              <p className="text-muted-foreground">
                Provide feedback to managers about processes, projects, or other workplace matters.
              </p>
            </div>
            <div className="bg-card rounded-lg border shadow-sm">
              <div className="p-6">
                <FeedbackForm onSuccess={() => setActiveTab("sent")} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sent">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Sent Feedback</h2>
              <p className="text-muted-foreground">Review feedback you've previously submitted to managers.</p>
            </div>

            {loadingSent ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sentFeedback.length === 0 ? (
              <div className="bg-muted p-8 rounded-md text-center">
                <p className="text-muted-foreground">You haven't sent any feedback yet.</p>
                <Button onClick={() => setActiveTab("new")} className="mt-4">
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Create New Feedback
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {sentFeedback.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle>{item.subject}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Sent {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 whitespace-pre-wrap">{item.message}</div>
                      <div className="text-sm text-muted-foreground">
                        Recipients: {item.recipients.map((r: any) => r.user.name).join(", ")}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {isManager && (
            <TabsContent value="received">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Received Feedback</h2>
                <p className="text-muted-foreground">
                  Review feedback submitted to you by employees in the organization.
                </p>
              </div>

              {loadingReceived ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : receivedFeedback.length === 0 ? (
                <div className="bg-muted p-8 rounded-md text-center">
                  <p className="text-muted-foreground">You haven't received any feedback yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {receivedFeedback.map((item) => (
                    <Card key={item.id} className={item.isRead ? "" : "border-primary"}>
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {item.subject}
                            {!item.isRead && (
                              <Badge variant="default" className="ml-2">
                                New
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground mt-1">
                            From: {item.sender.name} ({item.sender.email})
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Received {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        {!item.isRead && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(item.id.toString())}>
                            Mark as Read
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap">{item.message}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

