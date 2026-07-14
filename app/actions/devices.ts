"use server";

import { db } from "@/lib/firebase-admin";
import { auth as adminAuth } from "@/lib/firebase-admin-auth";
import { getCurrentUserId } from "./user";
import { cookies } from "next/headers";

export async function getUserDevices() {
  try {
    const uid = await getCurrentUserId();
    if (!uid || !db) return { devices: [], error: "Not authenticated" };

    const snapshot = await db.collection("users").doc(uid).collection("devices").orderBy("lastActive", "desc").get();
    
    const cookieStore = await cookies();
    const currentDeviceId = cookieStore.get("deviceId")?.value;

    const devices = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        os: data.os || "Unknown",
        browser: data.browser || "Unknown",
        deviceType: data.deviceType || "desktop",
        ip: data.ip || "Unknown IP",
        lastActive: data.lastActive,
        isCurrentDevice: doc.id === currentDeviceId
      };
    });

    return { devices, success: true };
  } catch (error: any) {
    console.error("Failed to fetch devices:", error);
    return { devices: [], error: "Failed to fetch devices" };
  }
}

export async function revokeDevice(deviceId: string) {
  try {
    const uid = await getCurrentUserId();
    if (!uid || !db) return { success: false, error: "Not authenticated" };

    const cookieStore = await cookies();
    const currentDeviceId = cookieStore.get("deviceId")?.value;

    if (deviceId === currentDeviceId) {
      return { success: false, error: "Cannot revoke current device directly from here." };
    }

    await db.collection("users").doc(uid).collection("devices").doc(deviceId).delete();

    return { success: true };
  } catch (error: any) {
    console.error("Failed to revoke device:", error);
    return { success: false, error: "Failed to revoke device" };
  }
}

export async function revokeAllOtherDevices() {
  try {
    const uid = await getCurrentUserId();
    if (!uid || !db || !adminAuth) return { success: false, error: "Not authenticated" };

    const cookieStore = await cookies();
    const currentDeviceId = cookieStore.get("deviceId")?.value;

    // 1. Delete all devices in Firestore EXCEPT the current one
    const snapshot = await db.collection("users").doc(uid).collection("devices").get();
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      if (doc.id !== currentDeviceId) {
        batch.delete(doc.ref);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to revoke other devices:", error);
    return { success: false, error: "Failed to revoke other devices" };
  }
}
