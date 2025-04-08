"use server"

import { db } from "@/lib/db"

// Function to get LDAP users with pagination and search
export async function getLdapUsers(page = 1, pageSize = 30, searchTerm = "") {
  const skip = (page - 1) * pageSize

  // Create search conditions
  const searchCondition = searchTerm
    ? {
        OR: [
          { sAMAccountName: { contains: searchTerm, mode: "insensitive" } },
          { displayName: { contains: searchTerm, mode: "insensitive" } },
          { cn: { contains: searchTerm, mode: "insensitive" } },
          { userPrincipalName: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    : {}

  // Get total count for pagination
  const totalCount = await db.ldapuser.count({
    where: searchCondition,
  })

  // Get users for current page
  const users = await db.ldapuser.findMany({
    where: searchCondition,
    orderBy: { id: "asc" },
    skip,
    take: pageSize,
  })

  return {
    users,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  }
}

// Function to get a single LDAP user by ID
export async function getLdapUserById(id: number) {
  return db.ldapuser.findUnique({
    where: { id },
  })
}

// Function to get LDAP user statistics
export async function getLdapUserStats() {
  const totalUsers = await db.ldapuser.count()

  const activeUsers = await db.ldapuser.count({
    where: {
      userAccountControl: {
        not: {
          // Not disabled (0x0002)
          bitwiseAnd: [2, 2],
        },
      },
    },
  })

  const disabledUsers = await db.ldapuser.count({
    where: {
      userAccountControl: {
        // Disabled (0x0002)
        bitwiseAnd: [2, 2],
      },
    },
  })

  const recentlyLoggedIn = await db.ldapuser.count({
    where: {
      lastLogon: {
        // Logged in within the last 30 days
        gt: BigInt(Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) * 10000 + 11644473600000 * 10000)),
      },
    },
  })

  return {
    totalUsers,
    activeUsers,
    disabledUsers,
    recentlyLoggedIn,
  }
}

