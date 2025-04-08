// app/api/user-upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { JSDOM } from "jsdom"
import { writeFile } from "fs/promises"
import { addUser } from "@/app/actions/user-actions"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file || !file.name.endsWith(".html")) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const html = Buffer.from(bytes).toString("utf-8")

  const dom = new JSDOM(html)
  const document = dom.window.document
  const rows = Array.from(document.querySelectorAll("table.table_layout tbody tr"))
  const users: any[] = []

  for (const row of rows) {
    const cols = row.querySelectorAll("td")
    if (cols.length < 10) continue

    const username = cols[2].textContent?.trim() || ""
    const rawLocation = cols[3].textContent?.trim() || ""
    const location = rawLocation
      .split("\n")
      .map(l => l.trim().replace(/^[0-9]+\.?\s*/, ""))
      .filter(Boolean)
    const enabled = cols[5].textContent?.trim()
    const groups = cols[8].innerHTML.replace(/<br\s*\/?>/gi, "\n").trim()
    const remarks = cols[9].innerHTML.replace(/<br\s*\/?>/gi, "\n").trim()
    
    if (enabled !== "Y") continue

    users.push({
      username,
      email: null,
      password: "Temp#Pass123",
      Remarks: remarks,
      role: groups
      .split("\n")
      .slice(0, 5)
      .map(r => r.trim().replace(/^[0-9]+\.?\s*/, ""))
      .filter(Boolean),
      location: location // ✅ flat array
    })
  }

  let success = 0
  for (const user of users) {
    try {
      await addUser(user)
      success++
    } catch (e) {
      console.error(`Failed to add ${user.username}:`, e)
    }
  }

  return NextResponse.json({
    message: `Imported ${success} users.`
  })
}
