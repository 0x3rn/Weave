import { createFirebaseSessionCookie, verifyFirebaseIdToken } from "@/lib/firebase-auth-server";
import { sql } from "@/lib/neon";
import { scheduleNotificationEmails } from "@/lib/notification-email";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const idToken = typeof body === "object" && body !== null && "idToken" in body && typeof body.idToken === "string"
      ? body.idToken
      : null;
    const rememberMe = typeof body === "object" && body !== null && "rememberMe" in body && body.rememberMe === true;

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // Set session expiration: 14 days if rememberMe, otherwise 1 day
    const expiresIn = rememberMe 
      ? 60 * 60 * 24 * 14 * 1000 // 14 days 
      : 60 * 60 * 24 * 1 * 1000; // 1 day

    // Create the session cookie
    const sessionCookie = await createFirebaseSessionCookie(idToken, expiresIn);

    // Verify token to get UID and update lastActive, plus device tracking
    try {
      const decodedToken = await verifyFirebaseIdToken(idToken);
      {
        // Parse User Agent
        const userAgent = request.headers.get("user-agent") || "";
        const parser = new UAParser(userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = parser.getDevice();
        
        // Extract IP (Next.js request standard headers or x-forwarded-for)
        const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "Unknown IP";

        // Generate a random deviceId
        const deviceId = crypto.randomUUID();

        const now = new Date().toISOString();
        const notificationId = crypto.randomUUID();
        const deviceData = {
          os: os.name ? `${os.name} ${os.version || ""}`.trim() : "Unknown OS",
          browser: browser.name ? `${browser.name} ${browser.version || ""}`.trim() : "Unknown Browser",
          deviceType: device.type || "desktop",
          ip: ip.split(",")[0].trim().slice(0, 64),
          userAgent: userAgent,
          createdAt: now,
          lastActive: now,
        };
        await sql.transaction(tx => [
          tx.query("update users set last_active_at=$2,updated_at=$2,payload=payload || $3::jsonb where id=$1", [decodedToken.uid, now, JSON.stringify({ lastActive: now })]),
          tx.query("insert into user_devices (id,user_id,os,browser,device_type,ip,last_active_at,payload) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)", [deviceId, decodedToken.uid, deviceData.os, deviceData.browser, deviceData.deviceType, deviceData.ip, now, JSON.stringify(deviceData)]),
          tx.query("insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,created_at,payload) values ($1,$2,$3,'security_alert','New sign-in detected',$4,false,false,'/settings/security',$5,$6::jsonb)", [notificationId, `security/sign-in/${deviceId}`, decodedToken.uid, `${deviceData.browser} on ${deviceData.os} signed in from ${deviceData.ip}.`, now, JSON.stringify({ type: "security_alert", title: "New sign-in detected", message: `${deviceData.browser} on ${deviceData.os} signed in from ${deviceData.ip}.`, isRead: false, link: "/settings/security", createdAt: now })]),
          tx.query("insert into notifications (id,source_path,user_id,notification_type,title,message,is_read,is_archived,link,created_at,payload) select $1,$2,id,'profile_incomplete','Complete your profile','Finish your profile so members can understand your skills and experience.',false,false,'/profile',$3,$4::jsonb from users where id=$5 and coalesce(profile_completion,case when payload->>'profileCompletion' ~ '^[0-9]+$' then (payload->>'profileCompletion')::integer else 0 end,0)<100 on conflict (source_path) do nothing", [`profile-incomplete/${decodedToken.uid}`, `account/profile-incomplete/${decodedToken.uid}`, now, JSON.stringify({ type: "profile_incomplete", title: "Complete your profile", message: "Finish your profile so members can understand your skills and experience.", isRead: false, link: "/profile", createdAt: now }), decodedToken.uid]),
        ]);
        scheduleNotificationEmails([notificationId, `profile-incomplete/${decodedToken.uid}`]);

        // Set the deviceId cookie
        const cookieStore = await cookies();
        cookieStore.set({
          name: "deviceId",
          value: deviceId,
          maxAge: Math.floor(expiresIn / 1000),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }
    } catch (e) {
      console.error("Failed to update lastActive or track device:", e);
      // We don't fail the login if this non-critical update fails
    }

    // Configure the session cookie options
    const options = {
      name: "session",
      value: sessionCookie,
      maxAge: Math.floor(expiresIn / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set(options);

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Session creation error:", error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { value: String(error) });
    return NextResponse.json({ error: "Unable to create session" }, { status: 500 });
  }
}
