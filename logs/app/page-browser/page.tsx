import { notFound, redirect } from "next/navigation"
import { getPages } from "../actions/page-actions"
import { getCurrentUser } from "../login/actions"
import { PageBrowserClient } from "./page-browser-client"
import { checkUserPermission } from "../actions/permission-actions"

export default async function PageBrowser() {
  const { pages = [], error } = await getPages()
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        redirect("/login")
      }
      const perm = await checkUserPermission(currentUser.id, "/page-browser")
      if (perm.hasPermission === false) {
        return notFound()
      }

  // Base URL for the iframe
  const baseUrl = "http://192.168.1.71:8000/wci1/menu"

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // If no pages exist, create a default page with ID 1
  const initialPages = pages.length > 0 ? pages : [{ id: 1, notes: null }]

  return <PageBrowserClient initialPages={initialPages} baseUrl={baseUrl} />
}

