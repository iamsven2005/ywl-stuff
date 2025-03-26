import { cookies } from "next/headers"
import type { NextAuthOptions } from "next-auth"
import { db } from "./db"

export async function getSession() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) {
    return null
  }

  return {
    user: {
      id: Number.parseInt(userId),
    },
  }
}

// Add the authOptions export
export const authOptions: NextAuthOptions = {
  providers: [],
  callbacks: {
    async session({ session }) {
      return session
    },
  },
}

export async function hasPermission(userId: number, requiredPermission: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) return false

    // Admin role has all permissions
    if (user.role.includes("admin")) return true

    // Check if the user has the specific permission
    return user.role.includes(requiredPermission)
  } catch (error) {
    console.error("Error checking permissions:", error)
    return false
  }
}

export async function checkUserRoles(userId: number, roles: string[]) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) return false

    // Check if the user has any of the specified roles
    return user.role.some((role) => roles.includes(role))
  } catch (error) {
    console.error("Error checking user roles:", error)
    return false
  }
}
