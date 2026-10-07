"use server";
import { sql } from "@/lib/neon";
import { revalidatePath } from "next/cache";
import { adminSession, adminRequestContext } from "@/lib/admin-ops-access";
import {
  getAdminList,
  getAdminDetail,
  getAdminHistory,
  type AdminFilters,
} from "@/lib/admin-ops-data";
import { AREA_META, isAdminArea, type AdminArea } from "@/lib/admin-ops-types";
import { validatePlatformSettings } from "@/lib/admin-ops-settings";
export async function listAdminRecords(area: AdminArea, filters: AdminFilters) {
  if (!isAdminArea(area)) throw new Error("Unknown admin area");
  return getAdminList(area, filters);
}
export async function readAdminRecord(area: AdminArea, id: string) {
  if (!isAdminArea(area)) throw new Error("Unknown admin area");
  return getAdminDetail(area, id);
}
export async function readAdminHistory(
  area: AdminArea,
  id: string,
  before?: { date: string; id: string },
) {
  if (!isAdminArea(area)) throw new Error("Unknown admin area");
  return getAdminHistory(area, id, before);
}
export async function mutateAdminRecord(input: {
  area: AdminArea | "roles";
  id: string;
  action: string;
  data: Record<string, unknown>;
  reason: string;
  operationId: string;
}) {
  try {
    if (
      !input ||
      (!isAdminArea(input.area) && input.area !== "roles") ||
      typeof input.id !== "string" ||
      input.id.length > 200 ||
      typeof input.action !== "string" ||
      typeof input.reason !== "string" ||
      input.reason.trim().length < 3 ||
      input.reason.length > 5000 ||
      typeof input.operationId !== "string" ||
      !/^[a-f0-9-]{36}$/.test(input.operationId) ||
      !input.data ||
      typeof input.data !== "object" ||
      Array.isArray(input.data) ||
      JSON.stringify(input.data).length > 150000
    )
      throw new Error("Check the operation details and reason");
    const permission =
      input.area === "roles" ? "roles.manage" : AREA_META[input.area].write;
    const session = await adminSession(permission);
    let data = input.data;
    if (input.area === "settings") {
      data = validatePlatformSettings(input.id, data);
      if (input.id === "security" && data.requireAdminMfa === true) {
        const { requireAuth } = await import("@/app/actions/user");
        const claims = await requireAuth();
        if (
          !claims.firebase ||
          typeof claims.firebase !== "object" ||
          !("sign_in_second_factor" in claims.firebase)
        )
          throw new Error("Sign in with MFA before enabling this policy");
      }
    }
    if (input.area === "cms" || input.area === "blog") {
      if (
        input.area === "blog" &&
        (typeof data.slug !== "string" ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug))
      )
        throw new Error("Blog slugs use lowercase words separated by hyphens");
      for (const key of ["featuredImage", "ogImage"])
        if (
          data[key] &&
          !(
            typeof data[key] === "string" &&
            /^\/api\/storage\/public\/(avatars|portfolio)\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/.test(
              data[key] as string,
            )
          )
        )
          throw new Error("Upload a supported public image");
      if (data.canonicalUrl) {
        let url: URL;
        try {
          url = new URL(String(data.canonicalUrl));
        } catch {
          throw new Error("Invalid canonical URL");
        }
        if (!["https:", "http:"].includes(url.protocol))
          throw new Error("Canonical URL must use HTTP or HTTPS");
      }
      if (
        !Array.isArray(data.tags) ||
        data.tags.length > 30 ||
        data.tags.some((v) => typeof v !== "string" || v.length > 80)
      )
        throw new Error("Invalid tags");
      if (data.kind === "navigation") {
        if (
          !Array.isArray(data.links) ||
          data.links.length > 50 ||
          data.links.some(
            (v) =>
              !v ||
              typeof v !== "object" ||
              typeof (v as Record<string, unknown>).label !== "string" ||
              !/^\/(?!\/)[A-Za-z0-9_/#?=&.-]*$/.test(
                String((v as Record<string, unknown>).href),
              ),
          )
        )
          throw new Error("Navigation links must point within Weave");
      }
    }
    if (data.attachments) {
      if (
        !Array.isArray(data.attachments) ||
        data.attachments.length > 5 ||
        data.attachments.some(
          (v) =>
            !v ||
            typeof v !== "object" ||
            typeof v.name !== "string" ||
            typeof v.url !== "string" ||
            !v.url.startsWith(
              "/api/storage/private/private/" + session.uid + "/misc/",
            ) ||
            !/^[A-Za-z0-9._-]+$/.test(v.url.split("/").at(-1) || ""),
        )
      )
        throw new Error(
          "Attachments must be uploaded by the current administrator",
        );
    }
    if (input.action === "note")
      await getAdminDetail(input.area as AdminArea, input.id);
    const [row] = await sql.query(
      "select admin_ops_mutate($1,$2,$3,$4,$5::jsonb,$6,$7,$8::jsonb)as result",
      [
        session.uid,
        input.area,
        input.id,
        input.action,
        JSON.stringify(data),
        input.reason.trim(),
        input.operationId,
        JSON.stringify(await adminRequestContext()),
      ],
    );
    revalidatePath(
      "/admin/" + (input.area === "roles" ? "settings" : input.area),
    );
    if (input.area === "cms" || input.area === "blog") {
      revalidatePath("/blog");
      revalidatePath("/pages", "layout");
    }
    return { success: true, result: row.result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save. Retry.",
    };
  }
}
export async function adminLookups(permission: string) {
  const allowed = [
    "ledger.adjust",
    "roles.manage",
    "cms.write",
    "blog.write",
    "support.write",
    "reports.write",
    "disputes.write",
  ];
  if (!allowed.includes(permission)) throw new Error("Invalid lookup");
  await adminSession(permission);
  const contentLookup =
    permission === "cms.write" || permission === "blog.write";
  const staffLookup = [
    "support.write",
    "reports.write",
    "disputes.write",
  ].includes(permission);
  const members = await sql.query(
    "select id,coalesce(full_name,username,'Member')as name," +
      (contentLookup || staffLookup ? "null::text" : "email") +
      " as email,admin_ops_role(id)as role from users where coalesce(account_status,'active')='active'" +
      (contentLookup
        ? " and (admin_ops_role(id) is not null or exists(select 1 from cms_taxonomy t where t.kind='author' and t.user_id=users.id))"
        : staffLookup
          ? " and admin_ops_role(id) is not null"
          : "") +
      " order by full_name,id",
  );
  const taxonomy =
    permission.includes("cms") || permission.includes("blog")
      ? await sql.query(
          "select id,kind,name,slug,bio,user_id from cms_taxonomy order by kind,name",
        )
      : [];
  return {
    members: members.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email || ""),
      role: row.role ? String(row.role) : null,
    })),
    taxonomy,
  };
}
export async function platformSettingsData() {
  const session = await adminSession("settings.read");
  const [settings, staff, roles, plans] = await Promise.all([
    sql.query(
      "select section,value,updated_at from platform_settings order by section",
    ),
    sql.query(
      "select u.id,coalesce(u.full_name,u.email,'Member')as name,u.email,admin_ops_role(u.id)as role,s.enabled from users u left join admin_staff_roles s on s.user_id=u.id where coalesce(u.account_status,'active')='active' order by name",
    ),
    sql.query("select name,permissions from admin_roles order by name"),
    sql.query(
      "select id,name,features,enabled,amount,currency,billing_interval,provider_plan_code is not null as configured from platform_plans order by name",
    ),
  ]);
  return { settings, staff, roles, plans, permissions: session.permissions };
}
export async function saveContentTaxonomy(data: {
  id?: string;
  kind: string;
  name: string;
  slug: string;
  bio?: string;
  userId?: string;
  reason: string;
}) {
  try {
    const session = await adminSession("blog.write");
    if (
      !["category", "author"].includes(data.kind) ||
      typeof data.name !== "string" ||
      data.name.length > 200 ||
      !data.name.trim() ||
      !/^[a-z0-9-]+$/.test(data.slug) ||
      typeof data.reason !== "string" ||
      data.reason.trim().length < 3
    )
      throw new Error("Invalid category or author");
    const id = data.id || crypto.randomUUID();
    const ctx = await adminRequestContext();
    await sql.query(
      "with changed as(insert into cms_taxonomy(id,kind,name,slug,bio,user_id)values($1,$2,$3,$4,$5,$6)on conflict(id)do update set name=excluded.name,slug=excluded.slug,bio=excluded.bio,user_id=excluded.user_id returning *)select admin_ops_audit($7,'taxonomy',$1,'save',null,to_jsonb(changed),$8,$9,$10::jsonb)from changed",
      [
        id,
        data.kind,
        data.name.trim(),
        data.slug,
        (data.bio || "").slice(0, 3000),
        data.userId || null,
        session.uid,
        data.reason,
        crypto.randomUUID(),
        JSON.stringify(ctx),
      ],
    );
    revalidatePath("/admin/blog");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save taxonomy",
    };
  }
}
