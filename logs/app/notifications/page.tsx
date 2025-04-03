import { Suspense } from "react"
import NotificationsClient from "./notifications-client"
import { getCurrentUser } from "@/app/login/actions"
import { notFound, redirect } from "next/navigation"
import { checkUserPermission } from "../actions/permission-actions"

export default async function NotificationsPage() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        redirect("/login")
      }
      const perm = await checkUserPermission(currentUser.id, "/notifications")
      if (perm.hasPermission === false) {
        return notFound()
      }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <NotificationsClient isAdmin={currentUser.role.includes("admin")} />
    </Suspense>
  )
}

