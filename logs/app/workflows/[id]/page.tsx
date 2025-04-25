import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkflowSteps } from "../workflow-steps"
import { getWorkflowById } from "../actions"
import { WorkflowStepsSkeleton } from "../workflow-steps-skeleton"

export default async function WorkflowDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const { success, data: workflow, error } = await getWorkflowById(id)

  if (!success) {
    return (
      <div className="container py-10">
        <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
          Error: {error || "Failed to load workflow"}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{workflow.name}</h1>
          <p className="text-muted-foreground mt-1">{workflow.description || "No description provided"}</p>
        </div>
        <Button>
          <Link href={`/workflows/${id}/edit`}>Edit Workflow</Link>
        </Button>
      </div>

      <Tabs defaultValue="steps">
        <TabsList className="mb-4">
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="steps">
          <Suspense fallback={<WorkflowStepsSkeleton />}>
            <WorkflowSteps workflowId={id} />
          </Suspense>
        </TabsContent>
        <TabsContent value="details">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Created</h3>
                  <p className="text-sm text-muted-foreground">{new Date(workflow.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-medium">Last Updated</h3>
                  <p className="text-sm text-muted-foreground">{new Date(workflow.updatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-medium">Total Steps</h3>
                  <p className="text-sm text-muted-foreground">{workflow.steps.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
