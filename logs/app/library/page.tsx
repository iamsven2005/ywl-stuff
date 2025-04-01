import { getLibraryEntries } from "@/app/actions/library-actions"
import { LibraryPage } from "./library-page"
import { authOptions, getSession } from "@/lib/auth"
import { getCurrentUser } from "../login/actions"
import { checkUserPermission } from "../actions/permission-actions"
import { notFound, redirect } from "next/navigation"

interface PageProps {
  searchParams: {
    search?: string
    category?: string
    pubYearFrom?: string
    pubYearTo?: string
    creationDateFrom?: string
    creationDateTo?: string
    sortBy?: string
    sortOrder?: string
    hasAttachment?: string
    page?: string
  }
}

export default async function Page({ searchParams }: PageProps) {
  const user =  await getCurrentUser()
  const isAdmin = !!user?.role?.some((role: string) => role.toLowerCase().includes("admin"))
  if(user){
    const perm = await checkUserPermission(user.id, "/library")
    if (perm.hasPermission === false){
      return notFound()
    }
  } else {
    redirect("/login")
  }

  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const search = searchParams.search || ""
  const category = searchParams.category || ""
  const pubYearFrom = searchParams.pubYearFrom ? Number.parseInt(searchParams.pubYearFrom) : undefined
  const pubYearTo = searchParams.pubYearTo ? Number.parseInt(searchParams.pubYearTo) : undefined
  const creationDateFrom = searchParams.creationDateFrom ? new Date(searchParams.creationDateFrom) : undefined
  const creationDateTo = searchParams.creationDateTo ? new Date(searchParams.creationDateTo) : undefined
  const sortBy = searchParams.sortBy || "refNo"
  const sortOrder = searchParams.sortOrder === "asc" || searchParams.sortOrder === "desc"
    ? searchParams.sortOrder
    : undefined
  
  const hasAttachment = searchParams.hasAttachment ? searchParams.hasAttachment === "true" : undefined

  const { entries, total, totalPages } = await getLibraryEntries(
    page,
    20,
    search,
    category,
    pubYearFrom,
    pubYearTo,
    creationDateFrom,
    creationDateTo,
    sortBy,
    sortOrder,
    hasAttachment,
  )

  return <LibraryPage entries={entries} total={total} totalPages={totalPages} currentPage={page} isAdmin={isAdmin} />
}

