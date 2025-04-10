import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const users = await db.user.findMany()

    for (const user of users) {
      if (!user.role || user.role.length === 0) continue
  
      for (const roleName of user.role) {
        // Find or create role
        const role = await db.roles.upsert({
          where: { name: roleName },
          update: {},
          create: { name: roleName, description: "" },
        })
  
        // Connect user to role
        await db.user.update({
          where: { id: user.id },
          data: {
            roles: {
              connect: { id: role.id },
            },
          },
        })
      }
    }
  
    console.log("✅ Migrated role[] to many-to-many roles table")

    return NextResponse.json({ success: "Done" }, { status: 200 })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}