import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HardHat } from "lucide-react"
import { getProjects } from "./actions/projects"
import { getCompanies } from "./actions/companies"
import { getInteractions } from "./actions/interactions"
import DashboardStats from "./components/dashboard-stats"
import ProjectList from "./components/project-list"
import InteractionList from "./components/interaction-list"
import MaterialOrderList from "./components/material-order-list"
import DashboardStatsSkeleton from "./components/skeletons/dashboard-stats-skeleton"
import ProjectListSkeleton from "./components/skeletons/project-list-skeleton"
import InteractionListSkeleton from "./components/skeletons/interaction-list-skeleton"
import { getCurrentUser } from "../login/actions"
import { notFound, redirect } from "next/navigation"
import { checkUserPermission } from "../actions/permission-actions"

export default async function Dashboard() {
  const { projects, error: projectsError } = await getProjects()
  const { companies, error: companiesError } = await getCompanies()
  const { interactions, error: interactionsError } = await getInteractions()
const currentUser = await getCurrentUser()
        if (!currentUser) {
          redirect("/login")
        }
        const perm = await checkUserPermission(currentUser.id, "/crm")
        if (perm.hasPermission === false) {
          return notFound()
        }
  // Calculate stats
  const activeProjects = projects?.filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED") || []

  const contractors = companies?.filter((c) => c.type === "CONTRACTOR" || c.type === "SUBCONTRACTOR") || []

  // Get upcoming inspections (would need to fetch from phases)
  const upcomingInspections = 0

  // Get open bids (would need to fetch from bids)
  const openBids = 0

  return (

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {companiesError || projectsError ? (
          <DashboardStatsSkeleton />
        ) : (
          <DashboardStats
            activeProjects={activeProjects.length}
            contractors={contractors.length}
            upcomingInspections={upcomingInspections}
            openBids={openBids}
          />
        )}

        <Tabs defaultValue="projects">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="projects">Active Projects</TabsTrigger>
              <TabsTrigger value="interactions">Recent Interactions</TabsTrigger>
              <TabsTrigger value="materials">Material Orders</TabsTrigger>
            </TabsList>
            <div className="ml-auto">
              <Button asChild>
                <Link href="/crm/projects/new">New Project</Link>
              </Button>
            </div>
          </div>
          <TabsContent value="projects" className="border-none p-0">
            <Card>
              <CardHeader>
                <CardTitle>Bridge Projects</CardTitle>
                <CardDescription>Manage your active bridge construction projects.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {projectsError ? (
                  <div className="p-4">
                    <ProjectListSkeleton />
                  </div>
                ) : (
                  <ProjectList projects={activeProjects} />
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-4">
                <Button variant="outline" asChild>
                  <Link href="/crm/projects">View All Projects</Link>
                </Button>
                <Button variant="outline">Export Data</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="interactions" className="border-none p-0">
            <Card>
              <CardHeader>
                <CardTitle>Recent Interactions</CardTitle>
                <CardDescription>Track your recent communications with contractors and vendors.</CardDescription>
              </CardHeader>
              <CardContent>
                {interactionsError ? (
                  <InteractionListSkeleton />
                ) : (
                  <InteractionList interactions={interactions?.slice(0, 5) || []} />
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/crm/interactions">View All Interactions</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="materials" className="border-none p-0">
            <Card>
              <CardHeader>
                <CardTitle>Material Orders</CardTitle>
                <CardDescription>Track pending and recent material orders for your projects.</CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialOrderList />
              </CardContent>
              <CardFooter className="flex justify-between pt-4">
                <Button variant="outline">New Order</Button>
                <Button variant="outline">View All Orders</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
  )
}
