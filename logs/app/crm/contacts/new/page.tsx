

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createContact, updateContact } from "@/app/crm/actions/contacts"
=import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, ArrowLeft } from "lucide-react"
import { getCompanies } from "../../actions/companies"
const contactSchema = z.object({
  name: z.string().min(2, { message: "Contact name must be at least 2 characters." }),
  title: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal("")),
  phone: z.string().optional(),
  expertise: z.string().optional(),
  remarks: z.string().optional(),
  companyId: z.coerce.number(),
})

export default function ContactForm({ contact = null }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: contact
      ? {
          ...contact,
        }
      : {
          name: "",
          title: "",
          email: "",
          phone: "",
          expertise: "",
          remarks: "",
          companyId: "",
        },
  })

  // Fetch companies on component mount
  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true)
      try {
        const response = await getCompanies()
        if (response.companies) {
          setCompanies(response.companies)
        }
      } catch (error) {
        console.error("Error fetching companies:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  async function onSubmit(data) {
    setIsSubmitting(true)

    try {
      if (contact) {
        const result = await updateContact(contact.id, data)

        if (result.error) {
          form.setError("root", { message: result.error })
          return
        }

        router.push(`/crm/contacts/${contact.id}`)
      } else {
        // Create new contact
        const result = await createContact(data)

        if (result.error) {
          form.setError("root", { message: result.error })
          return
        }

        router.push(`/crm/contacts`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      form.setError("root", { message: "An unexpected error occurred" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <div className="flex items-center gap-4">
      <Button variant="outline" size="icon" asChild>
        <Link href="/crm/contacts">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
      </Button>
      <h1 className="text-2xl font-bold">Add New Contact</h1>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>Add a new contact to your CRM system</CardDescription>
      </CardHeader>
      <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contact name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Project Manager" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="(123) 456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expertise"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expertise</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Structural Engineering" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes about this contact" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && <div className="text-red-500 text-sm">{form.formState.errors.root.message}</div>}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || loading}>
            {isSubmitting ? "Saving..." : "Save Contact"}
          </Button>
        </div>
      </form>
    </Form>
              </CardContent>
              </Card>
            </main>
  )
}
