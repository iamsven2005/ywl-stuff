import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import { getContact } from "@/app/crm/actions/contacts"
import { notFound } from "next/navigation"
import ContactForm from "@/app/crm/components/contact-form"

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const contactId = Number.parseInt(params.id)
  const { contact, error } = await getContact(contactId)

  if (error || !contact) {
    notFound()
  }

  return (

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/crm/contacts/${contact.id}`}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Contact</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Edit details for {contact.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm contact={contact} />
          </CardContent>
        </Card>
      </main>
  )
}
