import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HardHat, Search, Plus } from "lucide-react"
import { getInteractions } from "../actions/interactions"
import InteractionList from "@/app/crm/components/interaction-list"
import InteractionListSkeleton from "@/app/crm/components/skeletons/interaction-list-skeleton"
import InteractionControls from "./interaction-controls"

export default async function InteractionsPage({
  searchParams,
}: {
  searchParams: { type?: string; search?: string }
}) {
  const { interactions, error } = await getInteractions()

  const filteredInteractions = interactions?.filter((i) => {
    const matchesType = searchParams.type && searchParams.type !== "all"
      ? i.interactionType === searchParams.type
      : true
    const matchesSearch = searchParams.search
      ? i.title.toLowerCase().includes(searchParams.search.toLowerCase()) ||
        i.notes?.toLowerCase().includes(searchParams.search.toLowerCase())
      : true
    return matchesType && matchesSearch
  })

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interactions</h1>
        <Button asChild>
          <Link href="/crm/interactions/new">
            <Plus className="mr-2 h-4 w-4" /> New Interaction
          </Link>
        </Button>
      </div>

      <InteractionControls initialSearch={searchParams.search} initialType={searchParams.type} />

      <Card>
        <CardHeader>
          <CardTitle>
            {searchParams.type && searchParams.type !== "all"
              ? `${searchParams.type} Interactions`
              : "All Interactions"}
          </CardTitle>
          <CardDescription>Track communications with contractors, vendors, and other stakeholders</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <InteractionListSkeleton /> : <InteractionList interactions={filteredInteractions || []} />}
        </CardContent>
      </Card>
    </main>
  )
}
