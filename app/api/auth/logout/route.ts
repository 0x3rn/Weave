import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin-auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (sessionCookie && auth) {
      // Clear the session from Firebase backend
      const decodedClaims = await auth.verifySessionCookie(sessionCookie).catch(() => null);
      if (decodedClaims) {
        await auth.revokeRefreshTokens(decodedClaims.sub);
      }
    }

    // Clear the cookie from the browser
    cookieStore.delete("session");

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirect") || "/login";
    
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
