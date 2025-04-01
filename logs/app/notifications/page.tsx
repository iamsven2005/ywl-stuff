import { Suspense } from "react"
import NotificationsClient from "./notifications-client"
import { getCurrentUser } from "@/app/login/actions"
import { redirect } from "next/navigation"

export default async function NotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      }
    >
      <NotificationsClient isAdmin={user.role.includes("admin")} />
    </Suspense>
  )
}

