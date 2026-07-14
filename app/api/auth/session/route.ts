import { auth } from "@/lib/firebase-admin-auth";
import { db } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";

export async function POST(request: Request) {
  try {
    const { idToken, rememberMe } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    if (!auth) {
      return NextResponse.json({ error: "Firebase Admin Auth not initialized" }, { status: 500 });
    }

    // Set session expiration: 14 days if rememberMe, otherwise 1 day
    const expiresIn = rememberMe 
      ? 60 * 60 * 24 * 14 * 1000 // 14 days 
      : 60 * 60 * 24 * 1 * 1000; // 1 day

    // Create the session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Verify token to get UID and update lastActive, plus device tracking
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      if (db) {
        await db.collection("users").doc(decodedToken.uid).update({
          lastActive: new Date().toISOString()
        });

        // Parse User Agent
        const userAgent = request.headers.get("user-agent") || "";
        const parser = new UAParser(userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = parser.getDevice();
        
        // Extract IP (Next.js request standard headers or x-forwarded-for)
        const ip = request.headers.get("x-forwarded-for") || "Unknown IP";

        // Generate a random deviceId
        const deviceId = crypto.randomUUID();

        await db.collection("users").doc(decodedToken.uid).collection("devices").doc(deviceId).set({
          os: os.name ? `${os.name} ${os.version || ""}`.trim() : "Unknown OS",
          browser: browser.name ? `${browser.name} ${browser.version || ""}`.trim() : "Unknown Browser",
          deviceType: device.type || "desktop",
          ip: ip.split(",")[0].trim(),
          userAgent: userAgent,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        });

        // Set the deviceId cookie
        const cookieStore = await cookies();
        cookieStore.set({
          name: "deviceId",
          value: deviceId,
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
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
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set(options);

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
