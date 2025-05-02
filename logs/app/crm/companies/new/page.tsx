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
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2">
          <HardHat className="h-6 w-6" />
          <h1 className="text-lg font-semibold">BridgeCRM</h1>
        </div>
        <nav className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/projects">Projects</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/companies">Companies</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/contacts">Contacts</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/reports">Reports</Link>
          </Button>
        </nav>
      </header>
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
    </div>
  )
}
