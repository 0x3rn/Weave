import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin-auth";
import { sql } from "@/lib/neon";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    const deviceId = cookieStore.get("deviceId")?.value;

    if (sessionCookie && auth) {
      // Clear the session from Firebase backend
      const decodedClaims = await auth.verifySessionCookie(sessionCookie).catch(() => null);
      if (decodedClaims) {
        // Remove device tracking
        if (deviceId) {
          try {
            await sql.query("delete from user_devices where id=$1 and user_id=$2", [deviceId, decodedClaims.sub]);
          } catch (e) {
            console.error("Failed to delete device on logout:", e);
          }
        }
        await auth.revokeRefreshTokens(decodedClaims.sub);
      }
    }

    // Clear the cookie from the browser
    cookieStore.delete("session");
    cookieStore.delete("deviceId");

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
    cookieStore.delete("deviceId");
    
    const url = new URL(request.url);
    const requestedRedirect = url.searchParams.get("redirect") || "/login";
    const redirectTo = requestedRedirect.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/login";
    
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
