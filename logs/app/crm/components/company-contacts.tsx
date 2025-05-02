import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, Plus } from "lucide-react"

export default function CompanyContacts({ company }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>People associated with {company.name}</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/crm/companies/${company.id}/contacts/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {company.contacts && company.contacts.length > 0 ? (
          <div className="border rounded-md">
            <div className="grid grid-cols-5 p-4 font-medium border-b">
              <div>Name</div>
              <div>Title</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Actions</div>
            </div>
            <div className="divide-y">
              {company.contacts.map((contact) => (
                <div key={contact.id} className="grid grid-cols-5 p-4 hover:bg-muted/50">
                  <div className="font-medium">
                    <Link href={`/crm/contacts/${contact.id}`} className="hover:underline">
                      {contact.name}
                    </Link>
                  </div>
                  <div>{contact.title || "N/A"}</div>
                  <div>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Mail className="h-3 w-3" /> {contact.email}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                  <div>
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <Phone className="h-3 w-3" /> {contact.phone}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/crm/contacts/${contact.id}`}>View</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/crm/contacts/${contact.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No contacts found for this company</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
