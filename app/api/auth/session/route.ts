import {
  createFirebaseSessionCookie,
  verifyFirebaseIdToken,
  getFirebaseSecurityState,
} from "@/lib/firebase-auth-server";
import { sql } from "@/lib/neon";
import { scheduleNotificationEmails } from "@/lib/notification-email";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { object, settingsFor } from "@/lib/settings";
import { createHash } from "node:crypto";
export async function POST(request: Request) {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url)
      .origin;
    if (request.headers.get("origin") !== origin)
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 },
      );
    const body = object(await request.json());
    if (body.rememberMe !== undefined && typeof body.rememberMe !== "boolean")
      return NextResponse.json(
        { error: "Invalid persistence preference" },
        { status: 400 },
      );
    if (typeof body.idToken !== "string")
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    const claims = await verifyFirebaseIdToken(body.idToken);
    if (!claims.auth_time || Date.now() / 1000 - claims.auth_time > 300)
      return NextResponse.json(
        { error: "Sign in again to create a new session" },
        { status: 401 },
      );
    const [user] = await sql.query(
      "select coalesce(account_status,'active') as status,payload from users where id=$1",
      [claims.uid],
    );
    if (
      !user ||
      !["active", "deactivated", "deletion_pending"].includes(
        String(user.status),
      )
    )
      return NextResponse.json(
        { error: "Account unavailable" },
        { status: 403 },
      );
    const recovery = user.status !== "active";
    const securityState = await getFirebaseSecurityState(claims.uid);
    const store = await cookies(),
      existingId = store.get("deviceId")?.value;
    const [existing] = existingId
      ? await sql.query(
          "select id,payload from user_devices where id=$1 and user_id=$2",
          [existingId, claims.uid],
        )
      : [];
    const currentCookie = store.get("session")?.value;
    const boundSession =
      currentCookie &&
      object(existing?.payload).sessionHash ===
        createHash("sha256").update(currentCookie).digest("hex");
    const rememberMe =
      body.rememberMe === undefined
        ? Boolean(boundSession && object(existing?.payload).rememberMe === true)
        : body.rememberMe === true;
    const expiresIn = (rememberMe ? 14 : 1) * 86400000;
    const sessionCookie = await createFirebaseSessionCookie(
      body.idToken,
      expiresIn,
    );
    const deviceId = existing ? String(existing.id) : crypto.randomUUID();
    const parser = new UAParser(request.headers.get("user-agent") || ""),
      browser = parser.getBrowser(),
      os = parser.getOS();
    const ip = (
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "Unknown IP"
    )
      .split(",")[0]
      .trim()
      .slice(0, 64);
    const now = new Date().toISOString(),
      notificationId = crypto.randomUUID();
    await sql.transaction((tx) => [
      tx.query("select record_member_security_state($1,$2::jsonb)", [
        claims.uid,
        JSON.stringify(securityState),
      ]),
      tx.query(
        "update users set last_active_at=$2,updated_at=$2,email=case when $3::boolean then $4 else email end where id=$1",
        [claims.uid, now, claims.email_verified === true, claims.email || null],
      ),
      tx.query(
        "insert into user_devices(id,user_id,os,browser,device_type,ip,last_active_at,payload) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb) on conflict(id) do update set last_active_at=excluded.last_active_at,payload=user_devices.payload||excluded.payload",
        [
          deviceId,
          claims.uid,
          os.name || "Unknown OS",
          browser.name || "Unknown browser",
          parser.getDevice().type || "desktop",
          ip,
          now,
          JSON.stringify({
            rememberMe,
            createdAt: now,
            lastActive: now,
            expiresAt: new Date(Date.now() + expiresIn).toISOString(),
            sessionHash: createHash("sha256")
              .update(sessionCookie)
              .digest("hex"),
          }),
        ],
      ),
      ...(!existing
        ? [
            tx.query(
              "insert into notifications(id,source_path,user_id,notification_type,title,message,link,created_at,payload) values($1,$2,$3,'security_alert','New sign-in detected',$4,'/settings/security',$5,'{}')",
              [
                notificationId,
                "security/sign-in/" + deviceId,
                claims.uid,
                (browser.name || "Browser") +
                  " on " +
                  (os.name || "device") +
                  " signed in from " +
                  ip +
                  ".",
                now,
              ],
            ),
          ]
        : []),
    ]);
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      ...(rememberMe ? { maxAge: expiresIn / 1000 } : {}),
    };
    store.set("session", sessionCookie, options);
    store.set("deviceId", deviceId, options);
    if (!existing) scheduleNotificationEmails([notificationId]);
    const preferences = settingsFor(
      "preferences",
      object(user.payload).preferences,
    );
    const landing =
      (
        {
          overview: "/dashboard",
          marketplace: "/marketplace",
          exchanges: "/exchanges",
          messages: "/messages",
        } as Record<string, string>
      )[String(preferences.dashboardLandingPage)] || "/dashboard";
    return NextResponse.json({ status: "success", recovery, landing });
  } catch (error) {
    console.error(
      "Session creation failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Unable to create session" },
      { status: 401 },
    );
  }
}
