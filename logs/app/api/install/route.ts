import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(req: NextRequest) {
  // Get client IP
  let rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "127.0.0.1"
  const ip = rawIp.replace(/^::ffff:/, "")

  // Path to the actual PowerShell script in /public/scripts/
  const filePath = path.join(process.cwd(), "public/scripts/GG.ps1")

  try {
    let script = await readFile(filePath, "utf8")

    // Replace all hardcoded IPs in the script (you can refine the pattern)
    script = script.replace(/http:\/\/[\d.:]+:8080\/data\.json/g, `http://${ip}:8080/data.json`)

    return new NextResponse(script, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": "inline; filename=GG.ps1"
      }
    })
  } catch (error) {
    console.error("Failed to read GG.ps1:", error)
    return new NextResponse("Error reading PowerShell script", { status: 500 })
  }
}
