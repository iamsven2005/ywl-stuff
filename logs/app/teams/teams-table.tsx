"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Trash2, Edit, Plus, Users, MapPin } from 'lucide-react'
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getTeams, deleteTeam } from "@/app/teams/actions"

export default function TeamsTable() {
  const router = useRouter()
  const [teams, setTeams] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null)
  const [teamMemberSearch, setTeamMemberSearch] = useState<Record<number, string>>({})
  const [teamLocationSearch, setTeamLocationSearch] = useState<Record<number, string>>({})
  const [teamLeaderSearch, setTeamLeaderSearch] = useState<Record<number, string>>({})

  // Fetch teams data
  const fetchTeams = async () => {
    try {
      const result = await getTeams()
      setTeams(result.teams)
      setUsers(result.users)
      setLocations(result.locations)
    } catch (error) {
      toast.error("Failed to fetch teams")
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  // Filter teams based on search term
  const filteredTeams = teams.filter((team) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      team.name.toLowerCase().includes(search) ||
      (team.description && team.description.toLowerCase().includes(search)) ||
      (team.remarks && team.remarks.toLowerCase().includes(search)) ||
      team.sequence.toString().includes(search)
    )
  })

  // Handle team deletion
  const confirmDeleteTeam = (teamId: number) => {
    setTeamToDelete(teamId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return

    try {
      await deleteTeam(teamToDelete)
      toast.success("Team deleted successfully")
      fetchTeams()
      setDeleteDialogOpen(false)
      setTeamToDelete(null)
    } catch (error) {
      toast.error("Failed to delete team")
    }
  }

  // Get users for a team
  const getTeamLeaders = (teamId: number) => {
    return teams
      .find((team) => team.id === teamId)
      ?.leaders.map((leader: any) => leader.user) || []
  }

  const getTeamMembers = (teamId: number) => {
    return teams
      .find((team) => team.id === teamId)
      ?.members.map((member: any) => member.user) || []
  }

  const getTeamLocations = (teamId: number) => {
    return teams
      .find((team) => team.id === teamId)
      ?.locations.map((location: any) => location.location) || []
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">
          Showing {filteredTeams.length} of {teams.length} teams
        </span>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/teams/add")} className="gap-2">
            <Plus className="h-4 w-4" /> Add Team
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sequence</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Leaders</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {searchTerm ? "No matching teams found." : "No teams found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredTeams.map((team) => {
                const teamLeaders = getTeamLeaders(team.id)
                const teamMembers = getTeamMembers(team.id)
                const teamLocations = getTeamLocations(team.id)

                return (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.sequence}</TableCell>
                    <TableCell>{team.description || team.remarks || "—"}</TableCell>
                    
                    {/* Team Leaders */}
                    <TableCell>
                      <Input
                        placeholder="Search leaders..."
                        value={teamLeaderSearch[team.id] || ""}
                        onChange={(e) =>
                          setTeamLeaderSearch((prev) => ({
                            ...prev,
                            [team.id]: e.target.value,
                          }))
                        }
                        className="mb-2"
                      />
                      {teamLeaders.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                          {teamLeaders
                            .filter((leader: any) => {
                              const query = (teamLeaderSearch[team.id] || "").toLowerCase()
                              return (
                                leader.username.toLowerCase().includes(query) ||
                                leader.email?.toLowerCase().includes(query)
                              )
                            })
                            .map((leader: any) => (
                              <Badge key={leader.id} variant="outline" className="flex items-center gap-1">
                                {leader.username}
                              </Badge>
                            ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No leaders</span>
                      )}
                    </TableCell>
                    
                    {/* Team Members */}
                    <TableCell>
                      <Input
                        placeholder="Search members..."
                        value={teamMemberSearch[team.id] || ""}
                        onChange={(e) =>
                          setTeamMemberSearch((prev) => ({
                            ...prev,
                            [team.id]: e.target.value,
                          }))
                        }
                        className="mb-2"
                      />
                      {teamMembers.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                          {teamMembers
                            .filter((member: any) => {
                              const query = (teamMemberSearch[team.id] || "").toLowerCase()
                              return (
                                member.username.toLowerCase().includes(query) ||
                                member.email?.toLowerCase().includes(query)
                              )
                            })
                            .map((member: any) => (
                              <Badge key={member.id} variant="secondary" className="flex items-center gap-1">
                                {member.username}
                              </Badge>
                            ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No members</span>
                      )}
                    </TableCell>
                    
                    {/* Team Locations */}
                    <TableCell>
                      <Input
                        placeholder="Search locations..."
                        value={teamLocationSearch[team.id] || ""}
                        onChange={(e) =>
                          setTeamLocationSearch((prev) => ({
                            ...prev,
                            [team.id]: e.target.value,
                          }))
                        }
                        className="mb-2"
                      />
                      {teamLocations.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                          {teamLocations
                            .filter((location: any) => {
                              const query = (teamLocationSearch[team.id] || "").toLowerCase()
                              return (
                                location.name.toLowerCase().includes(query) ||
                                location.code?.toLowerCase().includes(query) ||
                                location.fullname?.toLowerCase().includes(query)
                              )
                            })
                            .map((location: any) => (
                              <Badge key={location.id} className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {location.name}
                              </Badge>
                            ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No locations</span>
                      )}
                    </TableCell>
                    
                    {/* Actions */}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/teams/edit/${team.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDeleteTeam(team.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
