"use server"

import { cookies } from "next/headers"
import { db } from "@/lib/db"


interface LoginCredentials {
  username: string
  password: string
}

export async function loginUser({ username, password }: LoginCredentials) {
  try {
    // Find the user by username
    const user = await db.user.findUnique({
      where: { username },
    });

    // If user not found or password doesn't match
    if (!user || user.password !== password) {
      return { success: false, message: "Invalid username or password" };
    }

    // Set a session cookie with the user ID
    const cookieStore = await cookies();
    cookieStore.set("userId", String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    // Return success
    return {
      success: true,
      userId: user.id,
      username: user.username,
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "An error occurred during login" };
  }
}


export async function logoutUser() {
  try {
    // Clear the session cookie
    const cookieStore = await cookies()
    cookieStore.delete("userId")

    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, message: "An error occurred during logout" }
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      return null
    }

    const user = await db.user.findUnique({
      where: { id: Number.parseInt(userId) },
      select: {
        id: true,
        username: true,
        email: true,
      },
    })

    return user
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

