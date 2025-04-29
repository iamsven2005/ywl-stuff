import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(
  req: NextRequest,
  { params }: { params: { ip: string; filename: string } }
) {
  const { ip, filename } = params

  // Validate IP
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    return new NextResponse("Invalid IP address format", { status: 400 })
  }

  const filePath = path.join(process.cwd(), "public", "scripts", filename)

  try {
    let script = await readFile(filePath, "utf8")
    script = script.replace(/PLACEHOLDER_IP/g, ip)

    return new NextResponse(script, {
      headers: {
        "Content-Type": "text/x-sh",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    })
  } catch (error) {
    console.error("Failed to read script:", error)
    return new NextResponse("Error reading script", { status: 500 })
  }
}
