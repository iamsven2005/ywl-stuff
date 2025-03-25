import { cookies } from "next/headers"
import type { NextAuthOptions } from "next-auth"

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

