import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { ip, mac, name, vendor } = data

    console.log(`Device info received: IP=${ip}, MAC=${mac}, Name=${name}, Vendor=${vendor}`)

    // Check if device already exists in the database
    const existingDevice = await db.devices.findUnique({
      where: {
        ip_address: ip,
      },
    })

    if (!existingDevice) {
      // Device doesn't exist, insert it
      await db.devices.create({
        data: {
          ip_address: ip,
          mac_address: mac || "",
          name: name || "Unknown",
          notes: vendor || "", // Store vendor in notes field
          status: "online",
        },
      })
      console.log(`New device added to database: ${ip}`)
    } else {
      // Optionally update existing device information
      console.log(`Device already exists in database: ${ip}`)
    }

    return NextResponse.json({ status: "success" })
  } catch (error) {
    console.error("Error processing device info:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

