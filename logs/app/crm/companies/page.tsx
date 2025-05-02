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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Companies</h1>
          <Button asChild>
            <Link href="/crm/companies/new">
              <Plus className="mr-2 h-4 w-4" /> Add Company
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <form className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" name="search" placeholder="Search companies..." className="w-full pl-8" />
          </form>
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

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all" asChild>
              <Link href="/crm/companies">All Companies</Link>
            </TabsTrigger>
            <TabsTrigger value="contractors" asChild>
              <Link href="/crm/companies?type=CONTRACTOR">Contractors</Link>
            </TabsTrigger>
            <TabsTrigger value="vendors" asChild>
              <Link href="/crm/companies?type=VENDOR">Vendors</Link>
            </TabsTrigger>
            <TabsTrigger value="partners" asChild>
              <Link href="/crm/companies?type=PARTNER">Partners</Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="border-none p-0 pt-4">
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
