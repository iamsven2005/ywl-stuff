"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getContacts(filter?: { companyId?: number }) {
  try {
    const where = filter?.companyId ? { companyId: filter.companyId } : {}

    const contacts = await db.contactPerson.findMany({
      where,
      include: {
        company: true,
      },
      orderBy: { name: "asc" },
    })

    return { contacts }
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return { error: "Failed to fetch contacts" }
  }
}

export async function getContact(id: number) {
  try {
    const contact = await db.contactPerson.findUnique({
      where: { id },
      include: {
        company: true,
        interactions: {
          include: {
            company: true,
            project: true,
          },
          orderBy: { interactionDate: "desc" },
        },
      },
    })

    if (!contact) {
      return { error: "Contact not found" }
    }

    return { contact }
  } catch (error) {
    console.error("Failed to fetch contact:", error)
    return { error: "Failed to fetch contact" }
  }
}

export async function createContact(data: {
  name: string
  title?: string
  email?: string
  phone?: string
  remarks?: string
  expertise?: string
  companyId: number
}) {
  try {
    const contact = await db.contactPerson.create({
      data,
      include: {
        company: true,
      },
    })

    revalidatePath("/crm/contacts")
    revalidatePath(`/crm/companies/${data.companyId}`)
    return { contact }
  } catch (error) {
    console.error("Failed to create contact:", error)
    return { error: "Failed to create contact" }
  }
}

export async function updateContact(
  id: number,
  data: {
    name?: string
    title?: string
    email?: string
    phone?: string
    remarks?: string
    expertise?: string
    companyId?: number
  },
) {
  try {
    const contact = await db.contactPerson.update({
      where: { id },
      data,
      include: {
        company: true,
      },
    })

    revalidatePath(`/crm/contacts/${id}`)
    revalidatePath("/crm/contacts")
    if (data.companyId) {
      revalidatePath(`/crm/companies/${data.companyId}`)
    }
    return { contact }
  } catch (error) {
    console.error("Failed to update contact:", error)
    return { error: "Failed to update contact" }
  }
}

export async function deleteContact(id: number) {
  try {
    const contact = await db.contactPerson.findUnique({
      where: { id },
      select: { companyId: true },
    })

    await db.contactPerson.delete({
      where: { id },
    })

    revalidatePath("/crm/contacts")
    if (contact) {
      revalidatePath(`/crm/companies/${contact.companyId}`)
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to delete contact:", error)
    return { error: "Failed to delete contact" }
  }
}
