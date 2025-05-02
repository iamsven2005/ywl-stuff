import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { HardHat, Search, Plus, Filter, Mail, Phone } from "lucide-react"
import { getContacts } from "../actions/contacts"
import ContactListSkeleton from "../components/skeletons/contact-list-skeleton"

export default async function ContactsPage() {
  const { contacts, error } = await getContacts()

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
          <h1 className="text-2xl font-bold">Contacts</h1>
          <Button asChild>
            <Link href="/crm/contacts/new">
              <Plus className="mr-2 h-4 w-4" /> Add Contact
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <form className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" name="search" placeholder="Search contacts..." className="w-full pl-8" />
          </form>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contact Directory</CardTitle>
            <CardDescription>Manage your contacts across all companies</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <ContactListSkeleton />
            ) : (
              <div className="border rounded-md">
                <div className="grid grid-cols-6 p-4 font-medium border-b">
                  <div>Name</div>
                  <div>Title</div>
                  <div>Company</div>
                  <div>Email</div>
                  <div>Phone</div>
                  <div>Actions</div>
                </div>
                <div className="divide-y">
                  {contacts && contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <div key={contact.id} className="grid grid-cols-6 p-4 hover:bg-muted/50">
                        <div className="font-medium">
                          <Link href={`/crm/contacts/${contact.id}`} className="hover:underline">
                            {contact.name}
                          </Link>
                        </div>
                        <div>{contact.title || "N/A"}</div>
                        <div>
                          <Link href={`/crm/companies/${contact.company.id}`} className="hover:underline">
                            {contact.company.name}
                          </Link>
                        </div>
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
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No contacts found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
