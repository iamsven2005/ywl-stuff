"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateUserProfile, uploadNdaDocument } from "@/app/actions/user-actions"
import EmergencyContactForm from "./emergency-contact-form"
import NdaUploadForm from "./nda-upload-form"
import AccountInfoForm from "./account-info-form"
import { toast } from "sonner"

export default function ProfileClient({ user }: any) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleProfileUpdate = async (formData: any) => {
    setIsSubmitting(true)
    try {
      const result = await updateUserProfile({
        userId: user.id,
        ...formData,
      })

      if (result.success) {
        toast.success("Your profile has been updated successfully.")
        router.refresh()
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNdaUpload = async (file: any) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id.toString())

      const result = await uploadNdaDocument(formData)

      if (result.success) {
        toast.success( "Your NDA document has been uploaded successfully.")
        router.refresh()
      } else {
        toast.error("Failed to upload document",)
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Tabs defaultValue="emergency-contacts" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="emergency-contacts">Emergency Contacts</TabsTrigger>
        <TabsTrigger value="nda-documents">NDA Documents</TabsTrigger>
        <TabsTrigger value="account-info">Account Information</TabsTrigger>
      </TabsList>

      <TabsContent value="emergency-contacts">
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <EmergencyContactForm user={user} onSubmit={handleProfileUpdate} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="nda-documents">
        <Card>
          <CardHeader>
            <CardTitle>NDA Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <NdaUploadForm user={user} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="account-info">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountInfoForm user={user} onSubmit={handleProfileUpdate} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

