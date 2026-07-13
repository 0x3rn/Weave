import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value;
  const path = request.nextUrl.pathname;

  // 1. Protected routes that require authentication
  const isProtectedRoute = path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/onboarding");

  // 2. Auth routes that logged-in users shouldn't access
  const isAuthRoute = path === "/login" || path === "/signup" || path === "/forgot-password";

  if (isProtectedRoute && !sessionCookie) {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && sessionCookie) {
    // Redirect authenticated users away from auth pages
    // They will be deep-checked by the layout, but shallow checked here
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Apply middleware to all routes except api, _next/static, _next/image, favicon.ico
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
