import { db } from "@/lib/db"
import { AddTeamForm } from "./add-team-form"
import TeamsTable from "./teams-table"


export default async function AddTeamPage() {
  const users = await db.user.findMany()
  const locations = await db.location.findMany()

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Add New Team</h1>
      <AddTeamForm users={users} locations={locations} />
      <TeamsTable />

    </div>
  )
}
