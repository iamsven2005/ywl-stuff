import { getTeamById } from "@/app/teams/actions"
import { notFound } from "next/navigation"
import { EditTeamForm } from "../../edit-team-form"
import { db } from "@/lib/db"

interface EditTeamPageProps {
  params: {
    id: string
  }
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const teamId = Number.parseInt(params.id)

  if (isNaN(teamId)) {
    notFound()
  }

  try {
    const { team } = await getTeamById(teamId)
    const users = await db.user.findMany()
    const locations = await db.location.findMany()

    // Format the data for the form
    const formattedTeam = {
      ...team,
      leaders: team.leaders.map((leader: any) => leader.user.id.toString()),
      members: team.members.map((member: any) => member.user.id.toString()),
      locations: team.locations.map((location: any) => location.location.id.toString()),
    }

    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Edit Team</h1>
        <EditTeamForm team={formattedTeam} users={users} locations={locations} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
