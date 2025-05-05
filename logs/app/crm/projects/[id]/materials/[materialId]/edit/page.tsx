import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import { getMaterial } from "@/app/crm/actions/materials"
import MaterialForm from "@/app/crm/components/material-form"

export default async function EditMaterialPage({ params }: { params: { id: string; materialId: string } }) {
    console.log("hijabdajkwhdbawdjhABWEDAKJEHFBWEJKFHB")
  const projectId = Number.parseInt(params.id)
  const materialId = Number.parseInt(params.materialId)

  const { material, error } = await getMaterial(materialId)

  if (error || !material || material.bridgeProject.projectId !== projectId) {
    return notFound()
  }

  return (

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Material</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Material Details</CardTitle>
            <CardDescription>Edit material for project: {material.bridgeProject.project.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <MaterialForm projectId={projectId} material={material} />
          </CardContent>
        </Card>
      </main>
  )
}
