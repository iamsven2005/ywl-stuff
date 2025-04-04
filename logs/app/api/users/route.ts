import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    console.log("Received data:", data)

    if (!data || typeof data.ldapData !== "string") {
      return NextResponse.json({ success: false, error: "Missing ldapData as string" }, { status: 400 })
    }

    // Parse the entries
    const userEntries = splitLdapEntries(data.ldapData)
    console.log(`Found ${userEntries.length} entries`)

    const results = []
    const errors = []

    for (const entry of userEntries) {
      try {
        const ldapData = parseLdapData(entry)
        const user = await processAndSaveLdapUser(ldapData)
        results.push(serializeUser(user))
      } catch (error) {
        console.error("Failed to process entry:", error)
        errors.push(error instanceof Error ? error.message : String(error))
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      users: results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Batch import error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

function splitLdapEntries(batch: string): string[] {
  const lines = batch.split("\n")
  const entries: string[] = []
  let current = ""
  for (const line of lines) {
    if (/^(dn:|distinguishedName:)/i.test(line) && current.trim()) {
      entries.push(current.trim())
      current = line + "\n"
    } else {
      current += line + "\n"
    }
  }
  if (current.trim()) entries.push(current.trim())
  return entries
}

function parseLdapData(text: string): Record<string, string> {
  const lines = text.split("\n")
  const data: Record<string, string> = {}
  for (const line of lines) {
    const idx = line.indexOf(":")
    if (idx > 0) {
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      data[key] = value
    }
  }
  return data
}

function parseLdapTimestamp(ts: string): Date | null {
  const match = ts.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.(\d+)Z$/)
  if (!match) return null
  const [, y, m, d, h, min, s] = match
  return new Date(+y, +m - 1, +d, +h, +min, +s)
}

async function processAndSaveLdapUser(data: Record<string, string>) {
  const whenCreated = data.whenCreated ? parseLdapTimestamp(data.whenCreated) : null
  const whenChanged = data.whenChanged ? parseLdapTimestamp(data.whenChanged) : null

  const user = await db.ldapUser.upsert({
    where: { distinguishedName: data.distinguishedName || "" },
    update: {
      objectGUID: data.objectGUID,
      objectSid: data.objectSid,
      cn: data.cn || "",
      sn: data.sn,
      givenName: data.givenName,
      displayName: data.displayName,
      sAMAccountName: data.sAMAccountName,
      userPrincipalName: data.userPrincipalName,
      whenCreated,
      whenChanged,
      pwdLastSet: data.pwdLastSet && data.pwdLastSet !== "0" ? BigInt(data.pwdLastSet) : null,
      lastLogon: data.lastLogon && data.lastLogon !== "0" ? BigInt(data.lastLogon) : null,
      lastLogonTimestamp:
        data.lastLogonTimestamp && data.lastLogonTimestamp !== "0" ? BigInt(data.lastLogonTimestamp) : null,
      userAccountControl: data.userAccountControl ? parseInt(data.userAccountControl, 10) : null,
      accountExpires: data.accountExpires && data.accountExpires !== "0" ? BigInt(data.accountExpires) : null,
      badPwdCount: data.badPwdCount ? parseInt(data.badPwdCount, 10) : null,
      logonCount: data.logonCount ? parseInt(data.logonCount, 10) : null,
      primaryGroupID: data.primaryGroupID ? parseInt(data.primaryGroupID, 10) : null,
      objectCategory: data.objectCategory,
      domain: extractDomain(data.distinguishedName),
      isActive: data.userAccountControl ? (parseInt(data.userAccountControl, 10) & 0x0002) === 0 : true,
      updatedAt: new Date(),
    },
    create: {
      distinguishedName: data.distinguishedName || "",
      objectGUID: data.objectGUID,
      objectSid: data.objectSid,
      cn: data.cn || "",
      sn: data.sn,
      givenName: data.givenName,
      displayName: data.displayName,
      sAMAccountName: data.sAMAccountName,
      userPrincipalName: data.userPrincipalName,
      whenCreated,
      whenChanged,
      pwdLastSet: data.pwdLastSet && data.pwdLastSet !== "0" ? BigInt(data.pwdLastSet) : null,
      lastLogon: data.lastLogon && data.lastLogon !== "0" ? BigInt(data.lastLogon) : null,
      lastLogonTimestamp:
        data.lastLogonTimestamp && data.lastLogonTimestamp !== "0" ? BigInt(data.lastLogonTimestamp) : null,
      userAccountControl: data.userAccountControl ? parseInt(data.userAccountControl, 10) : null,
      accountExpires: data.accountExpires && data.accountExpires !== "0" ? BigInt(data.accountExpires) : null,
      badPwdCount: data.badPwdCount ? parseInt(data.badPwdCount, 10) : null,
      logonCount: data.logonCount ? parseInt(data.logonCount, 10) : null,
      primaryGroupID: data.primaryGroupID ? parseInt(data.primaryGroupID, 10) : null,
      objectCategory: data.objectCategory,
      domain: extractDomain(data.distinguishedName),
      isActive: data.userAccountControl ? (parseInt(data.userAccountControl, 10) & 0x0002) === 0 : true,
      importedAt: new Date(),
      updatedAt: new Date(),
    },
  })

  return user
}

function extractDomain(dn?: string): string | null {
  if (!dn) return null
  const parts = dn.match(/DC=([^,]+)/g)
  return parts ? parts.map((dc) => dc.replace("DC=", "")).join(".") : null
}

function serializeUser(user: any) {
  return {
    ...user,
    pwdLastSet: user.pwdLastSet ? user.pwdLastSet.toString() : null,
    lastLogon: user.lastLogon ? user.lastLogon.toString() : null,
    lastLogonTimestamp: user.lastLogonTimestamp ? user.lastLogonTimestamp.toString() : null,
    accountExpires: user.accountExpires ? user.accountExpires.toString() : null,
  }
}