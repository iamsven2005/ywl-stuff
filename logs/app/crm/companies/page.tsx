import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HardHat, Search, Plus, Filter, Building2, Truck, Handshake, FileText, HardDrive } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCompanies } from "../actions/companies"
import CompanyList from "../components/company-list"
import CompanyListSkeleton from "../components/skeletons/company-list-skeleton"

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  const type = searchParams.type as any
  const { companies, error } = await getCompanies(type ? { type } : undefined)

  return (
   
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Companies</h1>
          <Button asChild>
            <Link href="/crm/companies/new">
              <Plus className="mr-2 h-4 w-4" /> Add Company
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Building2 className="mr-2 h-4 w-4" />
                  <Link href="/crm/companies?type=CONTRACTOR" className="w-full">
                    Contractors
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Truck className="mr-2 h-4 w-4" />
                  <Link href="/crm/companies?type=VENDOR" className="w-full">
                    Vendors
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Handshake className="mr-2 h-4 w-4" />
                  <Link href="/crm/companies?type=PARTNER" className="w-full">
                    Partners
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <Link href="/crm/companies?type=CONSULTANT" className="w-full">
                    Consultants
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HardDrive className="mr-2 h-4 w-4" />
                  <Link href="/crm/companies?type=SUBCONTRACTOR" className="w-full">
                    Subcontractors
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/crm/companies" className="w-full">
                  Clear filters
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>


            <Card>
              <CardHeader className="px-6 py-4">
                <CardTitle>
                  {type ? `${type.charAt(0) + type.slice(1).toLowerCase()} Companies` : "All Companies"}
                </CardTitle>
                <CardDescription>
                  {type
                    ? `Manage all ${type.toLowerCase()} companies in your CRM system.`
                    : "Manage all companies in your CRM system."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {error ? <CompanyListSkeleton /> : <CompanyList companies={companies || []} />}
              </CardContent>
            </Card>
      </main>
  )
}
