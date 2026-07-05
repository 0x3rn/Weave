import { auth } from "@/lib/firebase-admin-auth";
import { db } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

    // Verify token to get UID and update lastActive
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      if (db) {
        await db.collection("users").doc(decodedToken.uid).update({
          lastActive: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error("Failed to update lastActive:", e);
      // We don't fail the login if this non-critical update fails
    }

    // Configure the cookie options
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
