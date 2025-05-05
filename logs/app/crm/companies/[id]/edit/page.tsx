import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import { getCompany } from "../../../actions/companies"
import { notFound } from "next/navigation"
import CompanyForm from "../../../components/company-form"

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  const companyId = Number.parseInt(params.id)
  const { company, error } = await getCompany(companyId)

  if (error || !company) {
    notFound()
  }

  return (

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/crm/companies/${company.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Company</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Edit details for {company.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyForm company={company} />
          </CardContent>
        </Card>
      </main>
  )
}
