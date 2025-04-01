import { notFound, redirect } from "next/navigation"
import ProfileClient from "./profile-client"
import { getUserById } from "../actions/user-actions"
import { getCurrentUser } from "../login/actions"
import { checkUserPermission } from "../actions/permission-actions"

export default async function ProfilePage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
  }
  const perm = await checkUserPermission(currentUser.id, "/alerts")
  if (perm.hasPermission === false) {
    return notFound()
  }
  const user = await getUserById(currentUser.id)

  if (!user) {
    return <div className="container mx-auto p-4">User not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <ProfileClient user={user} />
    </div>
  )
}

