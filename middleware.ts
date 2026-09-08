import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value;
  const path = request.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/onboarding");
  const isAuthRoute =
    path === "/login" ||
    path === "/signup" ||
    path === "/forgot-password";

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
