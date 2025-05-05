import { Button } from "@/components/ui/button"
import { getCurrentUser } from "../login/actions"
import Link from "next/link"


export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  const user = await getCurrentUser()
  const userid = user?.id
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/equipment">Equipment</Link>
          </Button>
        </nav>
      </header>
{children}
</div>


  )
}

