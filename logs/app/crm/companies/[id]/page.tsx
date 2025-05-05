import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HardHat, Building2, Mail, Phone, Globe, MapPin, ArrowLeft, Edit } from "lucide-react"
import { getCompany } from "../../actions/companies"
import { notFound } from "next/navigation"
import CompanyContacts from "../../components/company-contacts"
import CompanyProjects from "../../components/company-projects"
import CompanyInteractions from "../../components/company-interactions"

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const companyId = Number.parseInt(params.id)
  const { company, error } = await getCompany(companyId)

  if (error) {
    return (

        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/crm/companies">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Company Details</h1>
          </div>

          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-500">Error loading company</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button className="mt-6" asChild>
              <Link href="/crm/companies">Return to Companies</Link>
            </Button>
          </div>
        </main>
    )
  }

  if (!company) {
    notFound()
  }

  return (
  
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/crm/companies">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <div className="ml-auto flex gap-2">
            <Button asChild>
              <Link href={`/crm/companies/${company.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Company
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Details about {company.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <dt className="font-medium text-muted-foreground">Type:</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        company.type === "CONTRACTOR"
                          ? "bg-green-100 text-green-800"
                          : company.type === "VENDOR"
                            ? "bg-blue-100 text-blue-800"
                            : company.type === "PARTNER"
                              ? "bg-purple-100 text-purple-800"
                              : company.type === "CONSULTANT"
                                ? "bg-indigo-100 text-indigo-800"
                                : company.type === "REGULATORY"
                                  ? "bg-orange-100 text-orange-800"
                                  : company.type === "SUBCONTRACTOR"
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {company.type}
                    </span>
                  </dd>
                </div>

                {company.industry && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Industry:</dt>
                    <dd>{company.industry}</dd>
                  </div>
                )}

                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <dt className="font-medium text-muted-foreground">Email:</dt>
                    <dd>
                      <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                        {company.email}
                      </a>
                    </dd>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <dt className="font-medium text-muted-foreground">Phone:</dt>
                    <dd>
                      <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline">
                        {company.phone}
                      </a>
                    </dd>
                  </div>
                )}

                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <dt className="font-medium text-muted-foreground">Website:</dt>
                    <dd>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {company.website}
                      </a>
                    </dd>
                  </div>
                )}

                {company.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <dt className="font-medium text-muted-foreground">Address:</dt>
                    <dd>{company.address}</dd>
                  </div>
                )}

                {company.specialties && company.specialties.length > 0 && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Specialties:</dt>
                    <dd className="flex flex-wrap gap-1 mt-1">
                      {company.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700"
                        >
                          {specialty}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {company.certifications && company.certifications.length > 0 && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Certifications:</dt>
                    <dd className="flex flex-wrap gap-1 mt-1">
                      {company.certifications.map((certification, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700"
                        >
                          {certification}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {company.rating !== null && company.rating !== undefined && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Rating:</dt>
                    <dd className="flex items-center">
                      <div className="text-yellow-500">
                        {Array.from({ length: Math.floor(company.rating) }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                        {Array.from({ length: 5 - Math.floor(company.rating) }).map((_, i) => (
                          <span key={i}>☆</span>
                        ))}
                      </div>
                      <span className="ml-1">{company.rating.toFixed(1)}/5</span>
                    </dd>
                  </div>
                )}

                {company.remarks && (
                  <div className="col-span-2">
                    <dt className="font-medium text-muted-foreground">Remarks:</dt>
                    <dd className="mt-1">{company.remarks}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Company Overview</CardTitle>
              <CardDescription>Key metrics and information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Projects</h3>
                  <p className="text-2xl font-bold mt-1">{company.projects?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {company.projects?.filter((p) => p.project.status === "ACTIVE").length || 0} active
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Contacts</h3>
                  <p className="text-2xl font-bold mt-1">{company.contacts?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {company.contacts?.filter((c) => c.title?.includes("Manager")).length || 0} managers
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground">Interactions</h3>
                  <p className="text-2xl font-bold mt-1">{company.interactions?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {company.interactions?.filter(
                      (i) => new Date(i.interactionDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    ).length || 0}{" "}
                    in last 30 days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contacts">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>
          <TabsContent value="contacts" className="border-none p-0 pt-4">
            <CompanyContacts company={company} />
          </TabsContent>
          <TabsContent value="projects" className="border-none p-0 pt-4">
            <CompanyProjects company={company} />
          </TabsContent>
          <TabsContent value="interactions" className="border-none p-0 pt-4">
            <CompanyInteractions company={company} />
          </TabsContent>
        </Tabs>
      </main>
  )
}
