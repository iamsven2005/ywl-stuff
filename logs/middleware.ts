import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the user ID from the cookies
  const userId = request.cookies.get("userId")?.value

  // If the user is not logged in and trying to access protected routes
  if (!userId && !request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the user is logged in and trying to access login page
  if (userId && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/logs", request.url))
  }

  return NextResponse.next()
}

// Match all routes except for static files, api routes, etc.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
}

