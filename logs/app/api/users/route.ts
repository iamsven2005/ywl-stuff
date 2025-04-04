import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log("Received data:", data)

    // Check if we have valid data
    if (!data || (typeof data === "object" && !data.ldapData)) {
      console.error("Invalid data format received:", data)
      return NextResponse.json(
        { success: false, error: "Invalid data format. Expected {ldapData: string}" },
        { status: 400 },
      )
    }

    // Get the LDAP data string
    const ldapText = typeof data === "string" ? data : data.ldapData

    if (!ldapText || typeof ldapText !== "string") {
      console.error("LDAP data is not a string:", ldapText)
      return NextResponse.json({ success: false, error: "LDAP data must be a string" }, { status: 400 })
    }

    // Parse the LDAP data
    const ldapData = parseLdapData(ldapText)

    // Extract domain from distinguishedName
    const domainMatch = ldapData.distinguishedName?.match(/DC=([^,]+)/g)
    const domain = domainMatch ? domainMatch.map((dc) => dc.replace("DC=", "")).join(".") : null

    // Convert string timestamps to Date objects
    const whenCreated = ldapData.whenCreated ? parseLdapTimestamp(ldapData.whenCreated) : null

    const whenChanged = ldapData.whenChanged ? parseLdapTimestamp(ldapData.whenChanged) : null

    // Convert string values to appropriate types
    const userAccountControl = ldapData.userAccountControl ? Number.parseInt(ldapData.userAccountControl, 10) : null

    const badPwdCount = ldapData.badPwdCount ? Number.parseInt(ldapData.badPwdCount, 10) : null

    const logonCount = ldapData.logonCount ? Number.parseInt(ldapData.logonCount, 10) : null

    const primaryGroupID = ldapData.primaryGroupID ? Number.parseInt(ldapData.primaryGroupID, 10) : null

    // Convert Windows file times to BigInt
    const pwdLastSet = ldapData.pwdLastSet && ldapData.pwdLastSet !== "0" ? BigInt(ldapData.pwdLastSet) : null

    const lastLogon = ldapData.lastLogon && ldapData.lastLogon !== "0" ? BigInt(ldapData.lastLogon) : null

    const lastLogonTimestamp =
      ldapData.lastLogonTimestamp && ldapData.lastLogonTimestamp !== "0" ? BigInt(ldapData.lastLogonTimestamp) : null

    const accountExpires =
      ldapData.accountExpires && ldapData.accountExpires !== "0" ? BigInt(ldapData.accountExpires) : null

    // Create or update the LDAP user in the database
    const ldapUser = await db.ldapUser.upsert({
      where: {
        distinguishedName: ldapData.distinguishedName || "",
      },
      update: {
        objectGUID: ldapData.objectGUID,
        objectSid: ldapData.objectSid,
        cn: ldapData.cn || "",
        sn: ldapData.sn,
        givenName: ldapData.givenName,
        displayName: ldapData.displayName,
        sAMAccountName: ldapData.sAMAccountName,
        userPrincipalName: ldapData.userPrincipalName,
        whenCreated,
        whenChanged,
        pwdLastSet,
        lastLogon,
        lastLogonTimestamp,
        userAccountControl,
        accountExpires,
        badPwdCount,
        logonCount,
        primaryGroupID,
        objectCategory: ldapData.objectCategory,
        domain,
        isActive: userAccountControl ? (userAccountControl & 0x0002) === 0 : true,
        updatedAt: new Date(),
      },
      create: {
        distinguishedName: ldapData.distinguishedName || "",
        objectGUID: ldapData.objectGUID,
        objectSid: ldapData.objectSid,
        cn: ldapData.cn || "",
        sn: ldapData.sn,
        givenName: ldapData.givenName,
        displayName: ldapData.displayName,
        sAMAccountName: ldapData.sAMAccountName,
        userPrincipalName: ldapData.userPrincipalName,
        whenCreated,
        whenChanged,
        pwdLastSet,
        lastLogon,
        lastLogonTimestamp,
        userAccountControl,
        accountExpires,
        badPwdCount,
        logonCount,
        primaryGroupID,
        objectCategory: ldapData.objectCategory,
        domain,
        isActive: userAccountControl ? (userAccountControl & 0x0002) === 0 : true,
        importedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, user: ldapUser })
  } catch (error) {
    console.error("Error importing LDAP data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import LDAP data: " + (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    )
  }
}

// Helper function to parse LDAP data from text format
function parseLdapData(ldapText: string) {
  if (!ldapText) {
    throw new Error("LDAP data is empty")
  }

  const lines = ldapText.split("\n")
  const ldapData: Record<string, string> = {}

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue

    // Parse attribute: value pairs
    const colonIndex = line.indexOf(":")
    if (colonIndex > 0) {
      const attribute = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      ldapData[attribute] = value
    }
  }

  return ldapData
}

// Helper function to parse LDAP timestamp format (YYYYMMDDhhmmss.fZ)
function parseLdapTimestamp(timestamp: string): Date | null {
  try {
    // Format: YYYYMMDDhhmmss.fZ
    // Example: 20250325064947.0Z
    const match = timestamp.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.(\d+)Z$/)
    if (!match) return null

    const [_, year, month, day, hour, minute, second] = match
    return new Date(
      Number.parseInt(year, 10),
      Number.parseInt(month, 10) - 1, // JavaScript months are 0-indexed
      Number.parseInt(day, 10),
      Number.parseInt(hour, 10),
      Number.parseInt(minute, 10),
      Number.parseInt(second, 10),
    )
  } catch (error) {
    console.error("Error parsing LDAP timestamp:", error)
    return null
  }
}

