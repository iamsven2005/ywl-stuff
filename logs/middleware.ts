import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value
  const path = request.nextUrl.pathname

  // If no user is logged in and trying to access protected routes
  if (!userId && path !== "/" && path !== "/login" && path !== "/latest_script.sh" ) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // For admin-only routes
  if (userId && (path.startsWith("/logs") || path.startsWith("/command-matches"))) {
    // We'll check the role in the page component since middleware can't access the database directly
    // This is just a first layer of protection
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
}

