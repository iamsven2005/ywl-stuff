"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getLdapUsers } from "@/app/actions/ldap-actions"
import { exportToExcel, prepareLdapUsersForExport } from "@/app/export-utils"
import { Download, Search } from "lucide-react"
import type { JSX } from "react/jsx-runtime"
import { formatLdapTimestamp } from "@/lib/ldap-utils"

export function LdapUsersTable() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Debounce search term to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch users when page or search term changes
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const result = await getLdapUsers(currentPage, pageSize, debouncedSearchTerm)
        setUsers(result.users)
        setTotalPages(result.totalPages)
        setTotalCount(result.totalCount)
      } catch (error) {
        console.error("Error fetching LDAP users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [currentPage, debouncedSearchTerm])

  // Handle export to Excel
  const handleExport = async () => {
    try {
      // For export, we'll get all users matching the search term
      const allResults = await getLdapUsers(1, 1000, debouncedSearchTerm)
      const exportData = prepareLdapUsersForExport(allResults.users)
      exportToExcel(exportData, "ldap-users")
    } catch (error) {
      console.error("Error exporting LDAP users:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        <Button variant="outline" onClick={handleExport} disabled={users.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Last Logon</TableHead>
                  <TableHead>Account Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {debouncedSearchTerm ? "No matching users found" : "No LDAP users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.sAMAccountName}</TableCell>
                      <TableCell>{user.displayName || user.cn}</TableCell>
                      <TableCell>{user.userPrincipalName || "-"}</TableCell>
                      <TableCell>{formatLdapTimestamp(user.lastLogon)}</TableCell>
                      <TableCell>{getAccountStatus(user.userAccountControl)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of{" "}
                {totalCount} users
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Helper function to interpret userAccountControl flags
function getAccountStatus(userAccountControl: number): JSX.Element {
  const ACCOUNT_DISABLED = 0x0002
  const PASSWORD_EXPIRED = 0x800000
  const LOCKED_OUT = 0x0010

  if (userAccountControl & ACCOUNT_DISABLED) {
    return <span className="text-red-500 font-medium">Disabled</span>
  } else if (userAccountControl & LOCKED_OUT) {
    return <span className="text-orange-500 font-medium">Locked Out</span>
  } else if (userAccountControl & PASSWORD_EXPIRED) {
    return <span className="text-yellow-500 font-medium">Password Expired</span>
  } else {
    return <span className="text-green-500 font-medium">Active</span>
  }
}

