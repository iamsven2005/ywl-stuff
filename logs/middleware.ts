import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value
  const path = request.nextUrl.pathname
  if (request.nextUrl.pathname.startsWith("/api/socket")) {
    return NextResponse.next()
  }
  // If no user is logged in and trying to access protected routes
  if (
    !userId &&
    path !== "/" &&
    path !== "/login" &&
    !path.startsWith("/scripts/") &&
    ![
      "/latest_script.sh",
      "/install.sh",
      "/script.sh",
      "/pid.py",
      "/auth-log.py",
      "/scan.py",
      "/disk.py",
      "/sensors.py"
    ].includes(path)
  ) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // For admin-only routes
  if (userId && (path.startsWith("/logs") || path.startsWith("/command-matches"))) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}