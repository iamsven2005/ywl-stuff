import { getLibraryEntries } from "@/app/actions/library-actions"
import { LibraryPage } from "./library-page"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "../login/actions"
import { checkUserPermission } from "../actions/permission-actions"

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
    pageSize?: string
  }
}

export default async function Page({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect("/login")
  }
  const perm = await checkUserPermission(currentUser.id, "/library")
  if (perm.hasPermission === false) {
    return notFound()
  }
  const isAdmin = currentUser.role.includes("admin")
  const page = searchParams.page ? Number.parseInt(searchParams.page) : 1
  const pageSize = Number(searchParams.pageSize || "10")
  const search = searchParams.search || ""
  const category = searchParams.category || ""
  const pubYearFrom = searchParams.pubYearFrom ? Number.parseInt(searchParams.pubYearFrom) : undefined
  const pubYearTo = searchParams.pubYearTo ? Number.parseInt(searchParams.pubYearTo) : undefined
  const creationDateFrom = searchParams.creationDateFrom ? new Date(searchParams.creationDateFrom) : undefined
  const creationDateTo = searchParams.creationDateTo ? new Date(searchParams.creationDateTo) : undefined
  const sortBy = searchParams.sortBy || "refNo"
  const sortOrder = searchParams.sortOrder || "asc"
  const hasAttachment = searchParams.hasAttachment ? searchParams.hasAttachment === "true" : undefined

  const { entries, total, totalPages } = await getLibraryEntries(
    page,
    pageSize,
    search,
    category,
    pubYearFrom,
    pubYearTo,
    creationDateFrom,
    creationDateTo,
    sortBy,
    sortOrder as "asc" | "desc",
    hasAttachment,
  )

  return (
    <LibraryPage
      entries={entries}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      pageSize={pageSize}
      isAdmin={isAdmin}
    />
  )
}

