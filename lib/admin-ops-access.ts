import "server-only";
import { requireAuth } from "@/app/actions/user";
import { sql } from "./neon";
import { headers } from "next/headers";
import { hasPermission } from "./admin-ops-types";
export async function adminSession(permission?: string) {
  const claims = await requireAuth();
  const [row] = await sql.query(
    "select u.id,u.full_name,u.time_zone,admin_ops_role(u.id) as admin_role,r.permissions,(select value from platform_settings where section='security') as security from users u left join admin_roles r on r.name=admin_ops_role(u.id) where u.id=$1",
    [claims.uid],
  );
  if (!row?.admin_role) throw new Error("Forbidden");
  const permissions = Array.isArray(row.permissions)
    ? row.permissions.filter(
        (value: unknown): value is string => typeof value === "string",
      )
    : [];
  if (permission && !hasPermission(permissions, permission))
    throw new Error("Forbidden: insufficient admin permissions");
  const security =
    row.security && typeof row.security === "object"
      ? (row.security as Record<string, unknown>)
      : {};
  if (
    typeof claims.auth_time === "number" &&
    Date.now() / 1000 - claims.auth_time >
      Number(security.adminSessionHours || 24) * 3600
  )
    throw new Error("Admin session expired. Sign in again.");
  const firebase =
    claims.firebase && typeof claims.firebase === "object"
      ? (claims.firebase as Record<string, unknown>)
      : {};
  if (security.requireAdminMfa === true && !firebase.sign_in_second_factor)
    throw new Error(
      "Administrator MFA is required. Sign in using your authenticator.",
    );
  return {
    uid: String(row.id),
    name: String(row.full_name || "Administrator"),
    role: String(row.admin_role),
    permissions,
    timeZone: String(row.time_zone || "UTC"),
  };
}
export async function adminRequestContext() {
  const h = await headers();
  return {
    userAgent: (h.get("user-agent") || "").slice(0, 500),
    requestId: (h.get("cf-ray") || h.get("x-request-id") || "").slice(0, 100),
  };
}
