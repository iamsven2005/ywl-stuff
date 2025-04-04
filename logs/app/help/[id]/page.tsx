import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import Link from "next/link"

export default async function AlertConditionDetailPage({ params }: { params: { id: string } }) {
  const note = await db.notes.findFirst({
    where: {
      id: parseInt(params.id),
    },
  })

  return (
    <div className="p-6">
    <Button  asChild><Link href={"/tickets/new"}>Back to new ticket</Link></Button>
      <h1 className="text-2xl font-bold mb-4">{note?.title}</h1>

      {/* Safely render HTML */}
      {note?.description ? (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: note.description }}
        />
      ) : (
        <p className="text-muted-foreground">No description available.</p>
      )}
    </div>
  )
}
