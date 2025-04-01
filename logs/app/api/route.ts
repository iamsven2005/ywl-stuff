import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  let rawIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.ip ||
    "127.0.0.1"

  // 🧽 Strip IPv6-mapped format like "::ffff:192.168.1.102"
  const ip = rawIp.replace(/^::ffff:/, "")

  const script = `
# === GG.ps1 GENERATED ===

$sensorUrl = "http://${ip}:8080/data.json"

Write-Host "📡 Sensor URL: $sensorUrl"

try {
    $sensorData = Invoke-RestMethod -Uri $sensorUrl
} catch {
    Write-Host "⚠️ Failed to fetch sensor data from $sensorUrl"
    $sensorData = $null
}

# ... continue with original script logic here
`

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": "inline; filename=GG.ps1"
    }
  })
}
