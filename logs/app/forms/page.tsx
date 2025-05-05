import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { getForms } from "./[id]/actions"
import { SearchAndFilterBar } from "./search-and-filter-bar";
import { FormCard } from "./form-card";

export default async function Home({ searchParams }: { searchParams: { q?: string; sort?: string } }) {
  const forms = await getForms()
  const searchQuery = searchParams.q?.toLowerCase() || ""
  const sortOption = searchParams.sort || "newest"

  // Filter forms based on search query
  const filteredForms = searchQuery
    ? forms.filter(
        (form) =>
          form.title.toLowerCase().includes(searchQuery) ||
          (form.description && form.description.toLowerCase().includes(searchQuery)),
      )
    : forms

  // Sort forms based on sort option
  const sortedForms = [...filteredForms].sort((a, b) => {
    if (sortOption === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortOption === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else if (sortOption === "alphabetical") {
      return a.title.localeCompare(b.title)
    } else if (sortOption === "responses") {
      return b.responses.length - a.responses.length
    }
    return 0
  })

  return (
    <div className="m-5 p-5">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Form Builder</h1>
        <Link href="/forms/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Form
          </Button>
        </Link>
      </div>

      <SearchAndFilterBar />

      {sortedForms.length === 0 && (
        <div className="text-center py-10">
          {searchQuery ? (
            <div>
              <h2 className="text-xl font-medium text-muted-foreground mb-4">
                No forms found matching "{searchQuery}"
              </h2>
              <Link href="/forms">
                <Button variant="outline">Clear Search</Button>
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-medium text-muted-foreground mb-4">No forms created yet</h2>
              <Link href="/forms/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create your first form
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {sortedForms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedForms.map((form) => (
            <FormCard key={form.id} form={form} />
          ))}
        </div>
      )}
    </div>
  )
}
