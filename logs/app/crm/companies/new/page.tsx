import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CompanyForm from "@/app/crm/components/company-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HardHat, ArrowLeft } from "lucide-react"
import type { CompanyType } from "@prisma/client"

export default function NewCompanyPage({ searchParams }: { searchParams?: { type?: string } }) {
  // Convert the type query parameter to a CompanyType if it exists
  const defaultType = searchParams?.type as CompanyType | undefined

  return (

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/crm/companies">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">New Company</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>Add a new company to your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyForm defaultType={defaultType} />
          </CardContent>
        </Card>
      </main>
  )
}
