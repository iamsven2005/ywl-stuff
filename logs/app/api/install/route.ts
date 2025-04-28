//The purpose of this code is to create a Next.js API route that serves a Bash script for uninstalling an application.
// It reads the script from the filesystem, optionally replaces a placeholder IP address with the client's IP address, and returns it as a downloadable file.
import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(req: NextRequest) {
  // Get client IP
  let rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "127.0.0.1"
  const ip = rawIp.replace(/^::ffff:/, "")

  // Path to the bash script stored in /public/scripts/
  const filePath = path.join(process.cwd(), "public/scripts/uninstall.sh")

  try {
    let script = await readFile(filePath, "utf8")

    // Inject or replace a placeholder IP (optional if you want to use it)
    // Example: Replace PLACEHOLDER_IP inside uninstall.sh
    script = script.replace(/PLACEHOLDER_IP/g, ip)

    return new NextResponse(script, {
      headers: {
        "Content-Type": "text/x-sh",
        "Content-Disposition": "attachment; filename=uninstall.sh",
      }
    })
  } catch (error) {
    console.error("Failed to read uninstall.sh:", error)
    return new NextResponse("Error reading Bash script", { status: 500 })
  }
}
