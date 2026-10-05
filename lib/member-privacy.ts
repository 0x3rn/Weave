import "server-only";
import { sql } from "./neon";
import { object, settingsFor } from "./settings";
import { getCurrentUserId } from "@/app/actions/user";

export async function profileAccess(userId: string) {
  const viewerId = await getCurrentUserId();
  const [row] = await sql.query("select * from users where id=$1", [userId]);
  if (!row) return null;
  const data = object(row.payload),
    privacy = settingsFor("privacy", data.privacy),
    sync = settingsFor("profileSync", data.profileSync);
  if (viewerId === userId) return { row, data, privacy, sync, owner: true };
  if (
    String(row.account_status ?? data.status ?? "active") !== "active" ||
    privacy.profileVisibility === "hidden" ||
    (privacy.profileVisibility === "members" && !viewerId)
  )
    return null;
  if (viewerId) {
    const [blocked] = await sql.query(
      "select 1 from blocked_users where (blocker_id=$1 and blocked_id=$2) or (blocker_id=$2 and blocked_id=$1)",
      [viewerId, userId],
    );
    if (blocked) return null;
  }
  return { row, data, privacy, sync, owner: false };
}

export async function canContact(senderId: string, recipientId: string) {
  const [row] = await sql.query(
    "select payload,coalesce(account_status,'active') as status from users where id=$1",
    [recipientId],
  );
  if (!row || row.status !== "active") return false;
  const [blocked] = await sql.query(
    "select 1 from blocked_users where (blocker_id=$1 and blocked_id=$2) or (blocker_id=$2 and blocked_id=$1)",
    [senderId, recipientId],
  );
  if (blocked) return false;
  const privacy = settingsFor("privacy", object(row.payload).privacy);
  if (privacy.contactPreferences === "nobody") return false;
  if (privacy.contactPreferences === "verified") {
    const [sender] = await sql.query(
      "select is_verified from users where id=$1",
      [senderId],
    );
    return sender?.is_verified === true;
  }
  if (privacy.contactPreferences === "collaborators") {
    const [exchange] = await sql.query(
      "select 1 from exchanges where (requester_id=$1 and provider_id=$2) or (requester_id=$2 and provider_id=$1) limit 1",
      [senderId, recipientId],
    );
    return !!exchange;
  }
  return true;
}

export async function assertExchangeAvailable(
  userId: string,
  isMutual: boolean,
) {
  const [row] = await sql.query(
    "select payload,coalesce(account_status,'active') as status,(select count(*) from exchanges where $1 in(requester_id,provider_id) and status not in('completed','cancelled')) as active_count from users where id=$1",
    [userId],
  );
  if (!row || row.status !== "active")
    throw new Error("This member is unavailable");
  const preferences = settingsFor(
    "preferences",
    object(row.payload).preferences,
  );
  if (preferences.openToReciprocalOnly && !isMutual)
    throw new Error("This member accepts reciprocal exchanges only");
  if (object(row.payload).marketplacePaused === true)
    throw new Error("This member has paused new marketplace activity");
  if (Number(row.active_count) >= Number(preferences.maxConcurrentExchanges))
    throw new Error("This member has reached their concurrent exchange limit");
}

// Aliases are internal constants; viewer and search values remain query parameters.
export function discoveryPredicate(
  alias = "u",
  viewer = "$1",
  searching = "$2",
) {
  if (!/^[a-z]+$/.test(alias)) throw new Error("Invalid SQL alias");
  return `coalesce(${alias}.account_status,${alias}.payload->>'status','active')='active'
    and coalesce(${alias}.payload->>'marketplacePaused','false')<>'true'
    and coalesce(${alias}.payload->'privacy'->>'profileVisibility','public')<>'hidden'
    and (coalesce(${alias}.payload->'privacy'->>'profileVisibility','public')<>'members' or ${viewer}::text is not null)
    and coalesce(${alias}.payload->'privacy'->>'appearInMarketplace','true')<>'false'
    and (not ${searching}::boolean or coalesce(${alias}.payload->'privacy'->>'appearInSearch','true')<>'false')
    and not exists(select 1 from blocked_users b where (b.blocker_id=${viewer} and b.blocked_id=${alias}.id) or (b.blocked_id=${viewer} and b.blocker_id=${alias}.id))`;
}

export function discoverable(row: Record<string, unknown>, searching: boolean) {
  const data = object(row.payload),
    privacy = settingsFor("privacy", data.privacy);
  return (
    String(row.account_status ?? data.status ?? "active") === "active" &&
    data.marketplacePaused !== true &&
    privacy.profileVisibility !== "hidden" &&
    privacy.appearInMarketplace === true &&
    (!searching || privacy.appearInSearch === true)
  );
}
