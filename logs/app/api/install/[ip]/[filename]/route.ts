import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

// Dynamic route: /api/install/[ip]
export async function GET(req: NextRequest, { params }: { params: { ip: string, filename: string } }) {
  const ip = params.ip

  // Validate the IP (basic sanity check)
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    return new NextResponse("Invalid IP address format", { status: 400 })
  }

  const filePath = path.join(process.cwd(), `public/scripts/${params.filename}`)

  try {
    let script = await readFile(filePath, "utf8")

    // Replace placeholder with IP
    script = script.replace(/PLACEHOLDER_IP/g, ip)

    return new NextResponse(script, {
      headers: {
        "Content-Type": "text/x-sh",
        "Content-Disposition": `attachment; filename=${params.filename}`,
      }
    })
  } catch (error) {
    console.error("Failed to read uninstall.sh:", error)
    return new NextResponse("Error reading script", { status: 500 })
  }
}
