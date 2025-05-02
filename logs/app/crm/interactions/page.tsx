import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HardHat, Search, Plus } from "lucide-react"
import { getInteractions } from "../actions/interactions"
import InteractionList from "@/app/crm/components/interaction-list"
import InteractionListSkeleton from "@/app/crm/components/skeletons/interaction-list-skeleton"

export default async function InteractionsPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  const { interactions, error } = await getInteractions()

  // Filter interactions by type if provided
  const filteredInteractions = searchParams.type
    ? interactions?.filter((i) => i.interactionType.includes(searchParams.type))
    : interactions

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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Interactions</h1>
          <Button asChild>
            <Link href="/crm/interactions/new">
              <Plus className="mr-2 h-4 w-4" /> New Interaction
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <form className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" name="search" placeholder="Search interactions..." className="w-full pl-8" />
          </form>
          <Select defaultValue={searchParams.type || "all"}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Meeting">Meetings</SelectItem>
              <SelectItem value="Call">Calls</SelectItem>
              <SelectItem value="Email">Emails</SelectItem>
              <SelectItem value="Site Visit">Site Visits</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{searchParams.type ? `${searchParams.type} Interactions` : "All Interactions"}</CardTitle>
            <CardDescription>Track communications with contractors, vendors, and other stakeholders</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? <InteractionListSkeleton /> : <InteractionList interactions={filteredInteractions || []} />}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
