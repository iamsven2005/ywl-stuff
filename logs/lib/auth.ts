import { cookies } from "next/headers"

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

