"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Get all LDAP users with optional filtering
export async function getLdapUsers(searchTerm?: string) {
  try {
    let whereClause = {}

    if (searchTerm) {
      whereClause = {
        OR: [
          { distinguishedName: { contains: searchTerm, mode: "insensitive" } },
          { cn: { contains: searchTerm, mode: "insensitive" } },
          { displayName: { contains: searchTerm, mode: "insensitive" } },
          { sAMAccountName: { contains: searchTerm, mode: "insensitive" } },
          { userPrincipalName: { contains: searchTerm, mode: "insensitive" } },
          { domain: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    }

    const users = await db.ldapUser.findMany({
      where: whereClause,
      orderBy: { importedAt: "desc" },
    })

    return users
  } catch (error) {
    console.error("Error fetching LDAP users:", error)
    throw new Error("Failed to fetch LDAP users")
  }
}

// Get a single LDAP user by ID
export async function getLdapUserById(id: number) {
  try {
    const user = await db.ldapUser.findUnique({
      where: { id },
    })

    return user
  } catch (error) {
    console.error("Error fetching LDAP user:", error)
    throw new Error("Failed to fetch LDAP user")
  }
}

// Delete an LDAP user
export async function deleteLdapUser(id: number) {
  try {
    await db.ldapUser.delete({
      where: { id },
    })

    revalidatePath("/ldap-users")
    return { success: true }
  } catch (error) {
    console.error("Error deleting LDAP user:", error)
    return { success: false, error: "Failed to delete LDAP user" }
  }
}

// Update LDAP user notes
export async function updateLdapUserNotes(id: number, notes: string) {
  try {
    await db.ldapUser.update({
      where: { id },
      data: { notes },
    })

    revalidatePath("/ldap-users")
    return { success: true }
  } catch (error) {
    console.error("Error updating LDAP user notes:", error)
    return { success: false, error: "Failed to update LDAP user notes" }
  }
}

// Helper function to decode User Account Control flags
export async function decodeUserAccountControl(uac: number) {
  const flags = {
    SCRIPT: 0x0001,
    ACCOUNTDISABLE: 0x0002,
    HOMEDIR_REQUIRED: 0x0008,
    LOCKOUT: 0x0010,
    PASSWD_NOTREQD: 0x0020,
    PASSWD_CANT_CHANGE: 0x0040,
    ENCRYPTED_TEXT_PWD_ALLOWED: 0x0080,
    TEMP_DUPLICATE_ACCOUNT: 0x0100,
    NORMAL_ACCOUNT: 0x0200,
    INTERDOMAIN_TRUST_ACCOUNT: 0x0800,
    WORKSTATION_TRUST_ACCOUNT: 0x1000,
    SERVER_TRUST_ACCOUNT: 0x2000,
    DONT_EXPIRE_PASSWORD: 0x10000,
    MNS_LOGON_ACCOUNT: 0x20000,
    SMARTCARD_REQUIRED: 0x40000,
    TRUSTED_FOR_DELEGATION: 0x80000,
    NOT_DELEGATED: 0x100000,
    USE_DES_KEY_ONLY: 0x200000,
    DONT_REQ_PREAUTH: 0x400000,
    PASSWORD_EXPIRED: 0x800000,
    TRUSTED_TO_AUTH_FOR_DELEGATION: 0x1000000,
    PARTIAL_SECRETS_ACCOUNT: 0x04000000,
  }

  const activeFlags = []
  for (const [flag, value] of Object.entries(flags)) {
    if ((uac & value) === value) {
      activeFlags.push(flag)
    }
  }

  return activeFlags
}

// Helper to format Windows file time to readable date
export async function formatFileTime(fileTime: bigint | null): Promise<string> {
  if (!fileTime || fileTime === BigInt(0) || fileTime === BigInt(9223372036854775807)) {
    return "Never"
  }
  const windowsEpochOffset = BigInt(116444736000000000)
  const jsTimestamp = Number((fileTime - windowsEpochOffset) / BigInt(10000))

  return new Date(jsTimestamp).toLocaleString()
}

