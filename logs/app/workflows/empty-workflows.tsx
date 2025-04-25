import { CreateWorkflowButton } from "./create-workflow-button";

export function EmptyWorkflows() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <h2 className="text-2xl font-bold mb-2">No workflows yet</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Create your first audit workflow to start managing your engineering processes
      </p>
      <CreateWorkflowButton />
    </div>
  )
}
