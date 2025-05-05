import type { Metadata } from "next"
import { FormBuilder } from "../[id]/form-builder"

export const metadata: Metadata = {
  title: "Create Form",
  description: "Create a new form with custom questions and response types",
}

export default function CreateFormPage() {
  return (
    <div className="m-5 p-5">
      <h1 className="text-3xl font-bold mb-8">Create New Form</h1>
      <FormBuilder />
    </div>
  )
}
