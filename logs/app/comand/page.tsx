import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCommandMatches } from "@/app/actions/command-monitoring-actions"
import { CommandMatchNotification } from "@/components/command-match-notification"
import { BulkAddressCommandMatches } from "@/components/bulk-address-command-matches"
import { AddressedCommandMatchesTable } from "@/components/addressed-command-matches-table"
import { Suspense } from "react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CommandMatchesPage({
  searchParams,
}: {
  searchParams: { tab?: string; page?: string }
}) {
  const tab = searchParams.tab || "unaddressed"
  const page = Number.parseInt(searchParams.page || "1", 10)
  const pageSize = 10

  const response = await getCommandMatches({
    addressed: tab === "addressed" ? true : tab === "bulk-address" ? false : false,
    page,
    pageSize,
  })
  
  const matches = response?.matches ?? [] // Ensure `matches` is always an array
  const totalCount = response?.totalCount ?? 0
  const pageCount = response?.pageCount ?? 1
  

  // Transform the matches to include the required properties
  const transformedMatches = matches.map((match) => ({
    ...match,
    command: match.commandText || "Unknown command", // Use commandText or fallback
    logEntry: match.logEntry || "No log entry available", // Use logEntry or fallback
    rule: {
      ...match.rule,
      name: match.rule.name || "Unknown rule",
    },
  }))

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Command Matches</h1>

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="unaddressed">Unaddressed</TabsTrigger>
          <TabsTrigger value="bulk-address">Address Multiple</TabsTrigger>
          <TabsTrigger value="addressed">Addressed</TabsTrigger>
        </TabsList>

        <TabsContent value="unaddressed" className="space-y-4">
          <Suspense fallback={<div>Loading unaddressed matches...</div>}>
            {transformedMatches.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No unaddressed command matches found.</p>
              </div>
            ) : (
              <div>
                {transformedMatches.map((match) => (
                  <CommandMatchNotification key={match.id} match={match} />
                ))}
              </div>
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="bulk-address" className="space-y-4">
          <Suspense fallback={<div>Loading unaddressed matches...</div>}>
            {transformedMatches.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No unaddressed command matches found.</p>
              </div>
            ) : (
              <BulkAddressCommandMatches matches={transformedMatches} />
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="addressed" className="space-y-4">
          <Suspense fallback={<div>Loading addressed matches...</div>}>
            {transformedMatches.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No addressed command matches found.</p>
              </div>
            ) : (
              <AddressedCommandMatchesTable matches={transformedMatches} />
            )}
          </Suspense>
        </TabsContent>
      </Tabs>

      {pageCount > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center gap-1">
            {Array.from({ length: pageCount }).map((_, i) => (
              <a
                key={i}
                href={`/command-matches?tab=${tab}&page=${i + 1}`}
                className={`px-3 py-1 rounded ${
                  page === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
              >
                {i + 1}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

