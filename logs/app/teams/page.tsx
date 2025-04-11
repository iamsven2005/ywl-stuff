import { db } from "@/lib/db"
import { AddTeamForm } from "./add-team-form"


export default async function AddTeamPage() {
  const users = await db.user.findMany()
  const locations = await db.location.findMany()

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Add New Team</h1>
      <AddTeamForm users={users} locations={locations} />
    </div>
  )
}
