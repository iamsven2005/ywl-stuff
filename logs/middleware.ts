import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkUserPermission } from "./app/actions/permission-actions"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = request.cookies.get("userId")?.value || ""
  const userId = token ? Number.parseInt(token) : null

  const isApiPath = path.startsWith("/api/")
  const isStaticAsset = path.includes(".") || path.startsWith("/_next")
  const isLoginPath = path === "/login"

  // 🟢 Publicly accessible script & utility routes
  const publicPaths = new Set([
    "/", "/login",
    "/latest_script.sh", "/install.sh", "/script.sh",
    "/pid.py", "/auth-log.py", "/scan.py", "/disk.py", "/sensors.py",
    "/scripts/GG.ps1"
  ])

  // ✅ Allow static files and API routes
  if (isApiPath || isStaticAsset) {
    return NextResponse.next()
  }

  // ✅ Allow public paths without authentication
  if (publicPaths.has(path)) {
    return NextResponse.next()
  }

  // 🔒 Redirect to login if not authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 🔁 Redirect logged-in users away from login page
  if (isLoginPath && token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 🔐 Optional: Check page-specific permission (e.g. /logs, /command)
  if (userId && ( path.startsWith("/command"))) {
    try {
      const { hasPermission } = await checkUserPermission(userId, path)

      if (!hasPermission) {
        return new NextResponse("Not Found", {
          status: 404,
          statusText: "Not Found"
        })
      }
    } catch (error) {
      console.error("Permission check failed:", error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}
