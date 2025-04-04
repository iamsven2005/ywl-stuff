import { getLdapUsers } from "@/app/actions/ldap-actions"
import LdapUsersTable from "@/app/tables/ldap-users-table"
import LdapImportForm from "./import-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload } from "lucide-react"

export default async function LdapUsersPage() {
  const users = await getLdapUsers()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">LDAP Users</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Import LDAP User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import LDAP User</DialogTitle>
            </DialogHeader>
            <LdapImportForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <LdapUsersTable initialUsers={users} />
      </div>
    </div>
  )
}

