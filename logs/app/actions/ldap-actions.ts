"use server"

import { db } from "@/lib/db"


// Get all LDAP users with pagination and search
export async function getLdapUsers(page = 1, pageSize = 10, searchTerm = "") {
  const skip = (page - 1) * pageSize

  // Build search conditions
  const searchCondition = searchTerm
    ? {
        OR: [
          { sAMAccountName: { contains: searchTerm, mode: "insensitive" } },
          { cn: { contains: searchTerm, mode: "insensitive" } },
          { name: { contains: searchTerm, mode: "insensitive" } },
          { displayName: { contains: searchTerm, mode: "insensitive" } },
          { userPrincipalName: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    : {}

  // Get total count for pagination
  const totalCount = await db.ldapuser.count({
    where: searchCondition,
  })

  // Get users with pagination
  const users = await db.ldapuser.findMany({
    where: searchCondition,
    orderBy: { sAMAccountName: "asc" },
    skip,
    take: pageSize,
  })

  return {
    users,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  }
}

// Format LDAP timestamp (Windows FileTime format) to readable date
export async function formatLdapTimestamp(timestamp: bigint | null | undefined): string {
  if (!timestamp || timestamp === BigInt(0)) return "Never"

  // Windows FileTime is in 100-nanosecond intervals since January 1, 1601 UTC
  // Convert to JavaScript timestamp (milliseconds since January 1, 1970 UTC)
  const windowsEpochOffset = BigInt(116444736000000000) // Difference in 100-nanosecond intervals
  const jsTimestamp = Number((timestamp - windowsEpochOffset) / BigInt(10000))

  return new Date(jsTimestamp).toLocaleString()
}

// Prepare LDAP users data for Excel export
export async function prepareLdapUsersForExport(users: any[]) {
  return users.map((user) => {
    return {
      Username: user.sAMAccountName,
      "Display Name": user.displayName || "",
      "Common Name": user.cn,
      Description: user.description || "",
      Email: user.userPrincipalName || "",
      "Account Created": formatLdapTimestamp(user.whenCreated),
      "Last Changed": formatLdapTimestamp(user.whenChanged),
      "Last Logon": formatLdapTimestamp(user.lastLogon),
      "Password Last Set": formatLdapTimestamp(user.pwdLastSet),
      "Account Expires":
        user.accountExpires === BigInt("9223372036854775807") ? "Never" : formatLdapTimestamp(user.accountExpires),
      "Logon Count": user.logonCount || 0,
      "Bad Password Count": user.badPwdCount || 0,
      "Distinguished Name": user.distinguishedName,
    }
  })
}

