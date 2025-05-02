import { HardHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import DashboardStatsSkeleton from "./components/skeletons/dashboard-stats-skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProjectListSkeleton from "./components/skeletons/project-list-skeleton"
import InteractionListSkeleton from "./components/skeletons/interaction-list-skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <HardHat className="h-6 w-6" />
          <h1 className="text-lg font-semibold">BridgeCRM</h1>
        </div>
        <nav className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/projects">Projects</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/companies">Companies</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/contacts">Contacts</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/reports">Reports</Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <DashboardStatsSkeleton />

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
                <ProjectListSkeleton />
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
                <InteractionListSkeleton />
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/crm/interactions">View All Interactions</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
