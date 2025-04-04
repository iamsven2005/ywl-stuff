import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log("Received data:", data)

    // Check if we have valid data
    if (!data) {
      return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 })
    }

    // Handle single user or array of users
    const isBatchImport = data.batchMode === true

    if (isBatchImport) {
      // Process batch import
      if (!data.ldapData || typeof data.ldapData !== "string") {
        return NextResponse.json({ success: false, error: "Batch import requires ldapData as string" }, { status: 400 })
      }

      // Split the input into individual user entries
      const userEntries = splitLdapEntries(data.ldapData)
      console.log(`Found ${userEntries.length} LDAP entries to import`)

      if (userEntries.length === 0) {
        return NextResponse.json({ success: false, error: "No valid LDAP entries found in input" }, { status: 400 })
      }

      // Process each user entry
      const results = []
      const errors = []

      for (const userEntry of userEntries) {
        try {
          const ldapData = parseLdapData(userEntry)
          const user = await processAndSaveLdapUser(ldapData)
          // Convert BigInt values to strings before returning
          results.push(serializeUser(user))
        } catch (error) {
          console.error("Error processing LDAP entry:", error)
          errors.push(error instanceof Error ? error.message : String(error))
        }
      }

      return NextResponse.json({
        success: true,
        imported: results.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        users: results,
      })
    } else {
      // Process single user import
      const ldapText = typeof data === "string" ? data : data.ldapData

      if (!ldapText || typeof ldapText !== "string") {
        return NextResponse.json({ success: false, error: "LDAP data must be a string" }, { status: 400 })
      }

      // Parse and save the single user
      const ldapData = parseLdapData(ldapText)
      const user = await processAndSaveLdapUser(ldapData)

      // Convert BigInt values to strings before returning
      return NextResponse.json({ success: true, user: serializeUser(user) })
    }
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

// Helper function to serialize user object with BigInt values
function serializeUser(user: any) {
  return {
    ...user,
    pwdLastSet: user.pwdLastSet !== null ? user.pwdLastSet.toString() : null,
    lastLogon: user.lastLogon !== null ? user.lastLogon.toString() : null,
    lastLogonTimestamp: user.lastLogonTimestamp !== null ? user.lastLogonTimestamp.toString() : null,
    accountExpires: user.accountExpires !== null ? user.accountExpires.toString() : null,
  }
}

// Helper function to split a batch of LDAP entries into individual entries
function splitLdapEntries(batchData: string): string[] {
  // LDAP entries typically start with "dn:" or "distinguishedName:"
  const dnMarkers = ["dn:", "distinguishedName:"]
  const entries: string[] = []
  let currentEntry = ""

  // Split by lines
  const lines = batchData.split("\n")

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Check if this line starts a new entry
    const isNewEntry = dnMarkers.some((marker) => trimmedLine.toLowerCase().startsWith(marker.toLowerCase()))

    if (isNewEntry && currentEntry.trim()) {
      // Save the previous entry if it exists
      entries.push(currentEntry.trim())
      currentEntry = line + "\n"
    } else {
      // Add to the current entry
      currentEntry += line + "\n"
    }
  }

  // Add the last entry if it exists
  if (currentEntry.trim()) {
    entries.push(currentEntry.trim())
  }

  return entries
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

// Helper function to process and save an LDAP user
async function processAndSaveLdapUser(ldapData: Record<string, string>) {
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
  return await db.ldapUser.upsert({
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

