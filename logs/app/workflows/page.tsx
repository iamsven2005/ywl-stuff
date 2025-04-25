import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateWorkflowButton } from "./create-workflow-button"
import { EmptyWorkflows } from "./empty-workflows"
import { WorkflowSearch } from "./workflow-search"
import { getWorkflows } from "./actions"

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { query?: string }
}) {
  const query = searchParams?.query || ""
  const { success, data: workflows, error } = await getWorkflows(query)

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Workflows</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <WorkflowSearch />
          <CreateWorkflowButton />
        </div>
      </div>

      {!success ? (
        <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
          Error: {error || "Failed to load workflows"}
        </div>
      ) : workflows.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Workflows</h2>
            <Button variant="outline" asChild>
              <Link href="/workflows">View All</Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.slice(0, 3).map((workflow) => (
              <Link href={`/workflows/${workflow.id}`} key={workflow.id}>
                <Card className="h-full hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle>{workflow.name}</CardTitle>
                    <CardDescription>Created on {new Date(workflow.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workflow.description || "No description provided"}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <div className="text-sm text-muted-foreground">{workflow.steps.length} steps</div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyWorkflows />
      )}
    </div>
  )
}
