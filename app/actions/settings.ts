"use server";

import { requireAuth } from "./user";
import { sql } from "@/lib/neon";
import { publicMember } from "@/lib/public-member";
import {
  object,
  validateSettingsPatch,
  type SettingsGroup,
} from "@/lib/settings";
import { revalidatePath } from "next/cache";
import { verifyFirebaseIdToken } from "@/lib/firebase-auth-server";

export async function saveSettings(group: SettingsGroup, input: unknown) {
  try {
    const { uid } = await requireAuth();
    const patch = validateSettingsPatch(group, input);
    const [row] = await sql.query(
      `update users set payload=jsonb_set(payload,array[$2],coalesce(payload->$2,'{}'::jsonb)||$3::jsonb) || case when $2='profileSync' then jsonb_build_object('publicProfile',coalesce(payload->'publicProfile','{}'::jsonb) || case when $3::jsonb->>'syncName'='false' and coalesce(payload->'profileSync'->>'syncName','true')<>'false' then jsonb_build_object('fullName',coalesce(full_name,payload->>'displayName','Member')) else '{}'::jsonb end || case when $3::jsonb->>'syncPhoto'='false' and coalesce(payload->'profileSync'->>'syncPhoto','true')<>'false' then jsonb_build_object('photoURL',coalesce(photo_url,'')) else '{}'::jsonb end) else '{}'::jsonb end,updated_at=now() where id=$1 returning username`,
      [uid, group, JSON.stringify(patch)],
    );
    if (!row) throw new Error("Account not found");
    revalidatePath("/settings", "layout");
    if (row.username) revalidatePath(`/u/${row.username}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save changes",
    };
  }
}

export async function getBlockedMembers() {
  const { uid } = await requireAuth();
  const rows = await sql.query(
    "select b.blocked_id as id,b.created_at,b.reason,u.full_name,u.username,u.payload from blocked_users b join users u on u.id=b.blocked_id where b.blocker_id=$1 order by b.created_at desc",
    [uid],
  );
  return rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    reason: row.reason,
    username: row.username,
    full_name: publicMember({
      ...row,
      id: String(row.id),
      payload: row.payload,
    }).fullName,
  }));
}
export async function unblockMember(id: string) {
  try {
    const { uid } = await requireAuth();
    await sql.query(
      "delete from blocked_users where blocker_id=$1 and blocked_id=$2",
      [uid, id],
    );
    revalidatePath("/settings/blocked");
    return { success: true };
  } catch {
    return { success: false, error: "Could not unblock this member" };
  }
}
export async function blockMember(id: string, reason = "") {
  try {
    const { uid } = await requireAuth();
    if (!id || id === uid || reason.length > 500)
      throw new Error("Invalid member or reason");
    const rows = await sql.query(
      "insert into blocked_users(blocker_id,blocked_id,reason) select $1,id,$3 from users where id=$2 on conflict(blocker_id,blocked_id) do update set reason=excluded.reason returning blocked_id",
      [uid, id, reason.trim()],
    );
    if (!rows.length) throw new Error("Member not found");
    revalidatePath("/settings/blocked");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not block member",
    };
  }
}

export async function changeAccountState(
  action: "pause" | "resume" | "deactivate" | "delete",
  idToken?: string,
  acknowledgment?: boolean,
) {
  try {
    const { uid } = await requireAuth();
    if (!["pause", "resume", "deactivate", "delete"].includes(action))
      throw new Error("Invalid action");
    if (action === "deactivate" || action === "delete") {
      const claims = await verifyFirebaseIdToken(idToken ?? "");
      if (
        claims.uid !== uid ||
        !claims.auth_time ||
        Date.now() / 1000 - claims.auth_time > 300
      )
        throw new Error("Confirm your identity again before continuing");
      if (action === "delete" && acknowledgment !== true)
        throw new Error("Confirm the final acknowledgment");
    }
    await sql.query("select change_member_account_state($1,$2)", [uid, action]);
    revalidatePath("/settings", "layout");
    revalidatePath("/marketplace");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Account action failed",
    };
  }
}

export async function disconnectIntegration(provider: string) {
  try {
    const { uid } = await requireAuth();
    await sql.query(
      "delete from user_integrations where user_id=$1 and provider=$2",
      [uid, provider],
    );
    revalidatePath("/settings/connections");
    return { success: true };
  } catch {
    return { success: false, error: "Could not disconnect account" };
  }
}
export async function savePortfolioConnection(provider: string, url: string) {
  try {
    const { uid } = await requireAuth();
    const host = (
      { dribbble: "dribbble.com", behance: "behance.net" } as Record<
        string,
        string
      >
    )[provider];
    const parsed = new URL(url);
    if (
      !host ||
      parsed.protocol !== "https:" ||
      ![host, `www.${host}`].includes(parsed.hostname) ||
      parsed.username ||
      parsed.password ||
      url.length > 2048
    )
      throw new Error("Enter a valid HTTPS portfolio URL");
    await sql.query(
      "insert into user_integrations(user_id,provider,account_name,profile_url,permissions) values($1,$2,$3,$4,'[\"profile link\"]'::jsonb) on conflict(user_id,provider) do update set account_name=excluded.account_name,profile_url=excluded.profile_url,connected_at=now()",
      [uid, provider, parsed.pathname, parsed.href],
    );
    revalidatePath("/settings/connections");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function settingsSnapshot() {
  const { uid } = await requireAuth();
  const [row] = await sql.query("select payload from users where id=$1", [uid]);
  return object(row?.payload);
}
