"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/app/login/actions"
import { Loader2 } from "lucide-react"

export default function withAdminAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
      async function checkAuth() {
        try {
          const user = await getCurrentUser()

          if (!user) {
            router.push("/login")
            return
          }

          if (!user?.role?.some(role => role.toLowerCase().includes("admin"))) {
            router.push("/notifications")
            return
          }

          setIsAdmin(true)
        } catch (error) {
          console.error("Auth check error:", error)
          router.push("/login")
        } finally {
          setIsLoading(false)
        }
      }

      checkAuth()
    }, [router])

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Checking permissions...</span>
        </div>
      )
    }

    return isAdmin ? <Component {...props} /> : null
  }
}

