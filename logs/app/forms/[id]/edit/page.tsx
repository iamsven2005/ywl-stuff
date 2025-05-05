import { FormBuilder } from "../form-builder"
import { getFormById } from "../actions"
import { notFound } from "next/navigation"

export default async function EditFormPage({ params }: { params: { id: string } }) {
  const formId = Number.parseInt(params.id)
  const form = await getFormById(formId)

  if (!form) {
    notFound()
  }

  return (
    <div className="m-5 p-5">
      <h1 className="text-3xl font-bold mb-8">Edit Form</h1>
      <FormBuilder form={form} />
    </div>
  )
}
