"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  deleteLdapUser,
  updateLdapUserNotes,
  decodeUserAccountControl,
  formatFileTime,
} from "@/app/actions/ldap-actions"
import { Search, MoreHorizontal, Eye, Trash2, Edit } from "lucide-react"

interface LdapUser {
  id: number
  distinguishedName: string
  objectGUID?: string | null
  objectSid?: string | null
  cn: string
  sn?: string | null
  givenName?: string | null
  displayName?: string | null
  sAMAccountName?: string | null
  userPrincipalName?: string | null
  whenCreated?: Date | null
  whenChanged?: Date | null
  pwdLastSet?: bigint | null
  lastLogon?: bigint | null
  lastLogonTimestamp?: bigint | null
  userAccountControl?: number | null
  accountExpires?: bigint | null
  badPwdCount?: number | null
  logonCount?: number | null
  primaryGroupID?: number | null
  objectCategory?: string | null
  importedAt: Date
  updatedAt: Date
  domain?: string | null
  isActive: boolean
  notes?: string | null
}

interface LdapUsersTableProps {
  initialUsers: LdapUser[]
}

export default function LdapUsersTable({ initialUsers }: LdapUsersTableProps) {
  const [users, setUsers] = useState<LdapUser[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<LdapUser | null>(null)
  const [notes, setNotes] = useState("")
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [uacFlags, setUacFlags] = useState<string[]>([])
  const [formattedTimes, setFormattedTimes] = useState<Record<string, string>>({})

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchFields = [
      user.distinguishedName,
      user.cn,
      user.displayName,
      user.sAMAccountName,
      user.userPrincipalName,
      user.domain,
    ]
      .filter(Boolean)
      .map((field) => field?.toLowerCase())

    return searchTerm === "" || searchFields.some((field) => field?.includes(searchTerm.toLowerCase()))
  })

  // Load UAC flags and formatted times when a user is selected
  useEffect(() => {
    if (selectedUser) {
      // Load UAC flags
      if (selectedUser.userAccountControl) {
        decodeUserAccountControl(selectedUser.userAccountControl)
          .then((flags) => setUacFlags(flags))
          .catch((err) => console.error("Error decoding UAC:", err))
      } else {
        setUacFlags([])
      }

      // Load formatted times
      const times: Record<string, bigint | null> = {
        pwdLastSet: selectedUser.pwdLastSet,
        lastLogon: selectedUser.lastLogon,
        lastLogonTimestamp: selectedUser.lastLogonTimestamp,
        accountExpires: selectedUser.accountExpires,
      }

      const loadFormattedTimes = async () => {
        const formatted: Record<string, string> = {}

        for (const [key, value] of Object.entries(times)) {
          if (value !== undefined) {
            formatted[key] = await formatFileTime(value)
          }
        }

        setFormattedTimes(formatted)
      }

      loadFormattedTimes()
    }
  }, [selectedUser])

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this LDAP user?")) {
      const result = await deleteLdapUser(id)
      if (result.success) {
        setUsers(users.filter((user) => user.id !== id))
      } else {
        alert("Failed to delete LDAP user")
      }
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedUser) return

    const result = await updateLdapUserNotes(selectedUser.id, notes)
    if (result.success) {
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, notes } : user)))
      setIsEditingNotes(false)
    } else {
      alert("Failed to update notes")
    }
  }

  const handleViewDetails = (user: LdapUser) => {
    setSelectedUser(user)
    setNotes(user.notes || "")
    setIsEditingNotes(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search LDAP users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>SAM Account Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Logon</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {searchTerm ? "No matching LDAP users found" : "No LDAP users found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                // Determine if account is disabled
                const isDisabled = user.userAccountControl ? (user.userAccountControl & 0x0002) === 0x0002 : false

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.displayName || user.cn}</TableCell>
                    <TableCell>{user.sAMAccountName}</TableCell>
                    <TableCell>{user.domain}</TableCell>
                    <TableCell>
                      {user.whenCreated ? new Date(user.whenCreated).toLocaleDateString() : "Unknown"}
                    </TableCell>
                    <TableCell>
                      {user.lastLogonTimestamp
                        ? "Loading..." // Will be replaced with formatted time
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {isDisabled ? (
                        <Badge variant="destructive">Disabled</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(user.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>LDAP User Details</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm font-medium">Display Name:</div>
                    <div className="text-sm">{selectedUser.displayName || "-"}</div>

                    <div className="text-sm font-medium">Common Name:</div>
                    <div className="text-sm">{selectedUser.cn}</div>

                    <div className="text-sm font-medium">Given Name:</div>
                    <div className="text-sm">{selectedUser.givenName || "-"}</div>

                    <div className="text-sm font-medium">Surname:</div>
                    <div className="text-sm">{selectedUser.sn || "-"}</div>

                    <div className="text-sm font-medium">SAM Account Name:</div>
                    <div className="text-sm">{selectedUser.sAMAccountName || "-"}</div>

                    <div className="text-sm font-medium">UPN:</div>
                    <div className="text-sm">{selectedUser.userPrincipalName || "-"}</div>

                    <div className="text-sm font-medium">Domain:</div>
                    <div className="text-sm">{selectedUser.domain || "-"}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Account Status</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm font-medium">Account Control:</div>
                    <div className="text-sm">{uacFlags.length > 0 ? uacFlags.join(", ") : "-"}</div>

                    <div className="text-sm font-medium">Bad Password Count:</div>
                    <div className="text-sm">{selectedUser.badPwdCount || "0"}</div>

                    <div className="text-sm font-medium">Logon Count:</div>
                    <div className="text-sm">{selectedUser.logonCount || "0"}</div>

                    <div className="text-sm font-medium">Primary Group ID:</div>
                    <div className="text-sm">{selectedUser.primaryGroupID || "-"}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm">Timestamps</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm font-medium">Created:</div>
                    <div className="text-sm">
                      {selectedUser.whenCreated ? new Date(selectedUser.whenCreated).toLocaleString() : "-"}
                    </div>

                    <div className="text-sm font-medium">Changed:</div>
                    <div className="text-sm">
                      {selectedUser.whenChanged ? new Date(selectedUser.whenChanged).toLocaleString() : "-"}
                    </div>

                    <div className="text-sm font-medium">Password Last Set:</div>
                    <div className="text-sm">{formattedTimes.pwdLastSet || "-"}</div>

                    <div className="text-sm font-medium">Last Logon:</div>
                    <div className="text-sm">{formattedTimes.lastLogon || "Never"}</div>

                    <div className="text-sm font-medium">Last Logon Timestamp:</div>
                    <div className="text-sm">{formattedTimes.lastLogonTimestamp || "Never"}</div>

                    <div className="text-sm font-medium">Account Expires:</div>
                    <div className="text-sm">{formattedTimes.accountExpires || "Never"}</div>

                    <div className="text-sm font-medium">Imported At:</div>
                    <div className="text-sm">{new Date(selectedUser.importedAt).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Identifiers</h3>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    <div className="text-sm font-medium">Distinguished Name:</div>
                    <div className="text-sm break-all">{selectedUser.distinguishedName}</div>

                    <div className="text-sm font-medium">Object GUID:</div>
                    <div className="text-sm">{selectedUser.objectGUID || "-"}</div>

                    <div className="text-sm font-medium">Object SID:</div>
                    <div className="text-sm">{selectedUser.objectSid || "-"}</div>

                    <div className="text-sm font-medium">Object Category:</div>
                    <div className="text-sm">{selectedUser.objectCategory || "-"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Notes</h3>
                <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(!isEditingNotes)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingNotes ? "Cancel" : "Edit Notes"}
                </Button>
              </div>

              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this LDAP user..."
                    rows={4}
                  />
                  <Button onClick={handleSaveNotes}>Save Notes</Button>
                </div>
              ) : (
                <div className="p-2 border rounded-md min-h-[100px] text-sm">
                  {selectedUser.notes || "No notes available."}
                </div>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

