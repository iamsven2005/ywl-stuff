import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import ProfileClient from "./profile-client"
import { getUserById } from "../actions/user-actions"

export default async function ProfilePage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const userId = Number.parseInt(session.user.id.toString())
  const user = await getUserById(userId)

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

