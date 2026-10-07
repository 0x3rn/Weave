"use server";
import { cookies } from "next/headers";
import {
  verifyFirebaseSessionCookie,
  verifyFirebaseIdToken,
} from "@/lib/firebase-auth-server";
import { sql } from "@/lib/neon";
import { createHash } from "node:crypto";
export async function restoreAccount(idToken: string) {
  try {
    const token = (await cookies()).get("session")?.value;
    if (!token) throw new Error("Sign in first");
    const session = await verifyFirebaseSessionCookie(token, true),
      fresh = await verifyFirebaseIdToken(idToken);
    if (
      session.uid !== fresh.uid ||
      !fresh.auth_time ||
      Date.now() / 1000 - fresh.auth_time > 300
    )
      throw new Error("Confirm your identity again");
    const deviceId = (await cookies()).get("deviceId")?.value;
    const [device] = deviceId
      ? await sql.query(
          "select payload->>'sessionHash' as session_hash from user_devices where id=$1 and user_id=$2",
          [deviceId, session.uid],
        )
      : [];
    if (
      device?.session_hash !== createHash("sha256").update(token).digest("hex")
    )
      throw new Error("This session has been signed out. Sign in again.");
    const rows = await sql.query(
      `with restored as (update users set account_status='active',updated_at=now() where id=$1 and (account_status='deactivated' or (account_status='deletion_pending' and exists(select 1 from account_deletion_requests where user_id=$1 and delete_after>now() and completed_at is null))) returning id),cancelled as (delete from account_deletion_requests where user_id in(select id from restored) returning user_id) select id from restored`,
      [session.uid],
    );
    if (!rows.length)
      throw new Error(
        "This account cannot be restored. The deletion grace period may have expired.",
      );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not restore account",
    };
  }
}
