"use server";

import { cookies } from "next/headers";
import { iso, payload, sql } from "@/lib/neon";
import { getCurrentUserId } from "./user";

export async function getUserDevices() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { devices: [], error: "Not authenticated" };
    const currentDeviceId = (await cookies()).get("deviceId")?.value;
    const rows = await sql.query("select * from user_devices where user_id=$1 order by last_active_at desc", [userId]);
    return {
      success: true,
      devices: rows.map(row => {
        const data = payload<Record<string, unknown>>(row.payload);
        return {
          id: String(row.id),
          os: String(row.os ?? data.os ?? "Unknown"),
          browser: String(row.browser ?? data.browser ?? "Unknown"),
          deviceType: String(row.device_type ?? data.deviceType ?? "desktop"),
          ip: String(row.ip ?? data.ip ?? "Unknown IP"),
          lastActive: iso(row.last_active_at ?? data.lastActive),
          isCurrentDevice: row.id === currentDeviceId,
        };
      }),
    };
  } catch (error) {
    console.error("Failed to fetch devices", error);
    return { devices: [], error: "Failed to fetch devices" };
  }
}

export async function revokeDevice(deviceId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };
  if (deviceId === (await cookies()).get("deviceId")?.value) return { success: false, error: "Cannot revoke current device directly from here." };
  await sql.query("delete from user_devices where id=$1 and user_id=$2", [deviceId, userId]);
  return { success: true };
}

export async function revokeAllOtherDevices() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };
  const currentDeviceId = (await cookies()).get("deviceId")?.value;
  await sql.query("delete from user_devices where user_id=$1 and ($2::text is null or id<>$2)", [userId, currentDeviceId ?? null]);
  return { success: true };
}
