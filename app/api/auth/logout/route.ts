import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  revokeFirebaseRefreshTokens,
  verifyFirebaseSessionCookie,
} from "@/lib/firebase-auth-server";
import { sql } from "@/lib/neon";
import { createHash } from "node:crypto";
import { internalRedirect } from "@/lib/internal-redirect";

async function endSession() {
  const store = await cookies();
  const session = store.get("session")?.value;
  const device = store.get("deviceId")?.value;
  if (session && device) {
    // The stored token fingerprint proves ownership without a certificate fetch.
    // A database failure leaves the cookies intact so revocation can be retried.
    await sql.query(
      "delete from user_devices where id=$1 and payload->>'sessionHash'=$2",
      [device, createHash("sha256").update(session).digest("hex")],
    );
  } else if (session) {
    const claims = await verifyFirebaseSessionCookie(session, false).catch(
      () => null,
    );
    if (claims) {
      await revokeFirebaseRefreshTokens(claims.uid || claims.sub);
    }
  }
  store.delete("session");
  store.delete("deviceId");
}

export async function POST(request: Request) {
  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin;
  if (request.headers.get("origin") !== origin)
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  try {
    await endSession();
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Session revocation failed. Retry signing out." },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 },
    );
  try {
    await endSession();

    const url = new URL(request.url);
    const requestedRedirect = url.searchParams.get("redirect") || "/login";
    const redirectTo = internalRedirect(requestedRedirect, "/login");

    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch {
    return NextResponse.json(
      { error: "Session revocation failed. Retry signing out." },
      { status: 503 },
    );
  }
}
