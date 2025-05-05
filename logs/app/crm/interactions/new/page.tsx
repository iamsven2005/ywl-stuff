import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import InteractionForm from "@/app/crm/components/interaction-form"
import { getCompanies } from "@/app/crm/actions/companies"
import { getContact } from "@/app/crm/actions/contacts"

export default async function NewInteractionPage({ searchParams }: { searchParams: { contactId?: string } }) {
  const contactId = searchParams.contactId ? Number.parseInt(searchParams.contactId) : undefined

  // Fetch all companies for the dropdown
  const { companies } = await getCompanies()

  // If contactId is provided, fetch the contact and its company
  let contact = null
  let preSelectedCompanyId = undefined
  let companyContacts = []

  if (contactId) {
    const contactResult = await getContact(contactId)
    if (!contactResult.error && contactResult.contact) {
      contact = contactResult.contact
      preSelectedCompanyId = contact.company.id

      // Get all contacts from this company for the contacts dropdown
      const company = companies.find((c) => c.id === preSelectedCompanyId)
      if (company && company.contacts) {
        companyContacts = company.contacts
      }
    }
  }

  return (
   
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/crm/interactions">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">New Interaction</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interaction Details</CardTitle>
            <CardDescription>
              {contact
                ? `Record a new interaction with ${contact.name}`
                : "Record details about a new interaction with a company or contact"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InteractionForm
              companies={companies}
              preSelectedCompanyId={preSelectedCompanyId}
              preSelectedContactId={contactId}
              companyContacts={companyContacts}
            />
          </CardContent>
        </Card>
      </main>
  )
}
