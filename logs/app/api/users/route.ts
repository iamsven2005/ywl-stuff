import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log("Received LDAP data:", data)

    // Parse the LDAP data
    const ldapUser = parseLdapData(data)

    // Store in database using upsert to update if exists or create if new
    const result = await db.ldapUser.upsert({
      where: {
        distinguishedName: ldapUser.distinguishedName,
      },
      update: {
        ...ldapUser,
        updatedAt: new Date(),
      },
      create: {
        ...ldapUser,
        importedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, user: result })
  } catch (error) {
    console.error("Error processing LDAP data:", error)
    return NextResponse.json({ success: false, error: "Failed to process LDAP data" }, { status: 500 })
  }
}

// Helper function to parse LDAP data format
function parseLdapData(data: string | Record<string, any>) {
  // If data is a string (raw LDAP format), parse it
  if (typeof data === "string") {
    const lines = data.split("\n")
    const parsedData: Record<string, any> = {}

    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.*)$/)
      if (match) {
        const [, key, value] = match
        parsedData[key.trim()] = value.trim()
      }
    }

    data = parsedData
  }

  // Convert string timestamps to Date objects
  const whenCreated = data.whenCreated ? parseTimestamp(data.whenCreated) : null

  const whenChanged = data.whenChanged ? parseTimestamp(data.whenChanged) : null

  return {
    distinguishedName: data.distinguishedName || "",
    objectGUID: data.objectGUID || null,
    objectSid: data.objectSid || null,
    cn: data.cn || "",
    sn: data.sn || null,
    givenName: data.givenName || null,
    displayName: data.displayName || null,
    sAMAccountName: data.sAMAccountName || null,
    userPrincipalName: data.userPrincipalName || null,
    whenCreated: whenCreated,
    whenChanged: whenChanged,
    pwdLastSet: data.pwdLastSet ? BigInt(data.pwdLastSet) : null,
    lastLogon: data.lastLogon ? BigInt(data.lastLogon) : null,
    lastLogonTimestamp: data.lastLogonTimestamp ? BigInt(data.lastLogonTimestamp) : null,
    userAccountControl: data.userAccountControl ? Number.parseInt(data.userAccountControl) : null,
    accountExpires: data.accountExpires ? BigInt(data.accountExpires) : null,
    badPwdCount: data.badPwdCount ? Number.parseInt(data.badPwdCount) : null,
    logonCount: data.logonCount ? Number.parseInt(data.logonCount) : null,
    primaryGroupID: data.primaryGroupID ? Number.parseInt(data.primaryGroupID) : null,
    objectCategory: data.objectCategory || null,
    domain: extractDomain(data.distinguishedName || ""),
  }
}

// Helper to extract domain from DN
function extractDomain(dn: string): string | null {
  const match = dn.match(/DC=([^,]+)/g)
  if (match) {
    return match.map((dc) => dc.replace("DC=", "")).join(".")
  }
  return null
}

// Helper to parse LDAP timestamps
function parseTimestamp(timestamp: string): Date | null {
  try {
    // Handle format like "20250325064947.0Z"
    if (timestamp.includes(".")) {
      const [datePart] = timestamp.split(".")
      const year = Number.parseInt(datePart.substring(0, 4))
      const month = Number.parseInt(datePart.substring(4, 6)) - 1 // JS months are 0-based
      const day = Number.parseInt(datePart.substring(6, 8))
      const hour = Number.parseInt(datePart.substring(8, 10))
      const minute = Number.parseInt(datePart.substring(10, 12))
      const second = Number.parseInt(datePart.substring(12, 14))

      return new Date(Date.UTC(year, month, day, hour, minute, second))
    }

    // Try standard date parsing as fallback
    return new Date(timestamp)
  } catch (error) {
    console.error("Error parsing timestamp:", timestamp, error)
    return null
  }
}

