"use server";
import { requireAuth } from "./user";
import { sql, iso } from "@/lib/neon";
import { storeUpload } from "@/lib/neon-storage";
import { revalidatePath } from "next/cache";
export async function getMemberCaseInbox(kind: "verification" | "support") {
  const actor = await requireAuth();
  if (!["verification", "support"].includes(kind))
    throw new Error("Unknown inbox");
  const rows =
    kind === "verification"
      ? await sql.query(
          "select id,verification_type as title,status,submitted_at as created_at,reason,expires_at from verification_requests where user_id=$1 order by submitted_at desc",
          [actor.uid],
        )
      : await sql.query(
          "select id,subject as title,status,created_at,category,priority from support_tickets where user_id=$1 order by updated_at desc",
          [actor.uid],
        );
  const ids = rows.map((row) => String(row.id));
  const events = ids.length
    ? await sql.query(
        "select resource_id,id,event_type,message,attachments,created_at from admin_case_events where resource_type=$1 and resource_id=any($2::text[])and not is_internal order by created_at",
        [kind, ids],
      )
    : [];
  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: String(row.status),
    createdAt: iso(row.created_at),
    reason: String(row.reason || ""),
    events: events
      .filter((event) => event.resource_id === row.id)
      .map((event) => ({
        id: String(event.id),
        message: String(event.message),
        type: String(event.event_type),
        date: iso(event.created_at),
        attachments:
          kind === "support" && Array.isArray(event.attachments)
            ? event.attachments.map(
                (doc: Record<string, unknown>, index: number) => ({
                  name: String(doc.name || "Attachment"),
                  href:
                    "/api/cases/attachment?id=" +
                    encodeURIComponent(String(row.id)) +
                    "&event=" +
                    event.id +
                    "&index=" +
                    index,
                }),
              )
            : [],
      })),
  }));
}
export async function submitMemberCase(
  kind: "verification" | "support",
  form: FormData,
) {
  try {
    const actor = await requireAuth();
    if (!["verification", "support"].includes(kind))
      throw new Error("Invalid submission");
    const text = String(form.get("message") || "").trim(),
      title = String(form.get("title") || "").trim(),
      category = String(form.get("category") || "account");
    if (
      text.length < 10 ||
      text.length > 5000 ||
      title.length < 3 ||
      title.length > 200
    )
      throw new Error(
        "Provide a title and a description of 10–5000 characters",
      );
    if (
      kind === "verification" &&
      !["identity", "professional", "trust"].includes(category)
    )
      throw new Error("Choose a supported verification type");
    if (
      kind === "support" &&
      ![
        "account",
        "verification",
        "marketplace",
        "exchange",
        "escrow",
        "skill_hours",
        "billing",
        "technical",
        "report",
        "dispute",
        "other",
      ].includes(category)
    )
      throw new Error("Invalid support category");
    const [existing] = await sql.query(
      kind === "verification"
        ? "select count(*)::int as count from verification_requests where user_id=$1 and (submitted_at>now()-interval '1 day' or status in('pending','under_review','flagged','needs_information')and verification_type=$2)"
        : "select count(*)::int as count from support_tickets where user_id=$1 and created_at>now()-interval '1 day' and $2::text is not null",
      [actor.uid, category],
    );
    if (Number(existing.count) >= (kind === "support" ? 10 : 1))
      throw new Error(
        "An open verification request exists or the submission limit was reached",
      );
    const file = form.get("file");
    let attachments: { name: string; url: string }[] = [];
    if (file instanceof File && file.size) {
      if (
        !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
          file.type,
        )
      )
        throw new Error("Attach a PDF or supported image");
      attachments = [
        {
          name: file.name.slice(0, 200),
          url: await storeUpload(actor.uid, file, "misc"),
        },
      ];
    }
    const id = crypto.randomUUID();
    if (kind === "verification") {
      if (!["identity", "professional", "trust"].includes(category))
        throw new Error("Choose a supported verification type");
      const [policy] = await sql.query(
        "select value from platform_settings where section='verification'",
      );
      if (policy?.value?.documentsRequired === true && attachments.length === 0)
        throw new Error("An identity document is required by platform policy");
      await sql.query(
        "with inserted as(insert into verification_requests(id,user_id,verification_type,statement,documents)values($1,$2,$3,$4,$5::jsonb)returning id)insert into admin_case_events(resource_type,resource_id,actor_id,event_type,message)select 'verification',id,$2,'submitted','Verification request submitted'from inserted",
        [id, actor.uid, category, text, JSON.stringify(attachments)],
      );
    } else {
      if (
        ![
          "account",
          "verification",
          "marketplace",
          "exchange",
          "escrow",
          "skill_hours",
          "billing",
          "technical",
          "report",
          "dispute",
          "other",
        ].includes(category)
      )
        throw new Error("Invalid support category");
      const [recent] = await sql.query(
        "select count(*)::int as count from support_tickets where user_id=$1 and created_at>now()-interval '1 day'",
        [actor.uid],
      );
      if (Number(recent.count) >= 10)
        throw new Error("You reached the daily support ticket limit");
      await sql.query(
        "with inserted as(insert into support_tickets(id,user_id,subject,category)values($1,$2,$3,$4)returning id)insert into admin_case_events(resource_type,resource_id,actor_id,event_type,message,attachments)select 'support',id,$2,'submitted',$5,$6::jsonb from inserted",
        [id, actor.uid, title, category, text, JSON.stringify(attachments)],
      );
    }
    revalidatePath(
      kind === "verification" ? "/verification" : "/support/contact",
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not submit. Retry.",
    };
  }
}
export async function replyToMemberCase(
  kind: "verification" | "support",
  id: string,
  message: string,
) {
  try {
    const actor = await requireAuth();
    if (
      typeof message !== "string" ||
      message.trim().length < 3 ||
      message.length > 5000
    )
      throw new Error("Enter a response of 3–5000 characters");
    let rows: Record<string, unknown>[] = [];
    if (kind === "support")
      rows = await sql.query(
        "with owned as(update support_tickets set status='awaiting_admin',updated_at=now()where id=$1 and user_id=$2 and status not in('closed','resolved') returning id)insert into admin_case_events(resource_type,resource_id,actor_id,event_type,message)select 'support',id,$2,'member_reply',$3 from owned returning id",
        [id, actor.uid, message.trim()],
      );
    else if (kind === "verification")
      rows = await sql.query(
        "with owned as(update verification_requests set statement=$3,status='pending',updated_at=now(),version=version+1 where id=$1 and user_id=$2 and status='needs_information'returning id)insert into admin_case_events(resource_type,resource_id,actor_id,event_type,message)select 'verification',id,$2,'resubmitted',$3 from owned returning id",
        [id, actor.uid, message.trim()],
      );
    else throw new Error("Unknown case");
    if (!rows.length)
      throw new Error("Case unavailable or not accepting responses");
    revalidatePath(
      kind === "verification" ? "/verification" : "/support/contact",
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not reply",
    };
  }
}
export async function submitPlatformReport(input: {
  type: string;
  id: string;
  category: string;
  description: string;
}) {
  try {
    const actor = await requireAuth();
    if (
      !["member", "marketplace", "exchange", "review", "content"].includes(
        input.type,
      ) ||
      typeof input.id !== "string" ||
      input.id.length > 200 ||
      typeof input.description !== "string" ||
      input.description.trim().length < 10 ||
      input.description.length > 5000 ||
      typeof input.category !== "string" ||
      input.category.length > 80
    )
      throw new Error("Invalid report");
    const tables: Record<string, string> = {
      member: "users",
      marketplace: "marketplace_requests",
      exchange: "exchanges",
      review: "reviews",
      content: "cms_documents",
    };
    const [resource] = await sql.query(
      "select id" +
        (input.type === "marketplace"
          ? ",requester_id as member_id"
          : input.type === "review"
            ? ",reviewer_id as member_id"
            : input.type === "exchange"
              ? ",requester_id,provider_id"
              : input.type === "member"
                ? ",id as member_id"
                : "") +
        " from " +
        tables[input.type] +
        " where id=$1" +
        (input.type === "content" ? "and status='published'" : ""),
      [input.id],
    );
    if (!resource) throw new Error("Reported item was not found");
    if (input.type === "exchange") {
      const [own] = await sql.query(
        "select id from exchanges where id=$1 and $2 in(requester_id,provider_id)",
        [input.id, actor.uid],
      );
      if (!own) throw new Error("Exchange is unavailable");
    }
    const [source] = await sql.query(
      "select id from platform_reports where reporter_id=$1 and resource_type=$2 and resource_id=$3 and status not in('resolved','dismissed')",
      [actor.uid, input.type, input.id],
    );
    if (source) return { success: true };
    const reportedMember =
      input.type === "exchange"
        ? resource.requester_id === actor.uid
          ? resource.provider_id
          : resource.requester_id
        : resource.member_id || null;
    await sql.query(
      "insert into platform_reports(id,reporter_id,resource_type,resource_id,reported_user_id,category,description)values($1,$2,$3,$4,$7,$5,$6)on conflict do nothing",
      [
        crypto.randomUUID(),
        actor.uid,
        input.type,
        input.id,
        input.category,
        input.description.trim(),
        reportedMember,
      ],
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not submit report",
    };
  }
}
export async function respondToMemberCase(
  kind: "verification" | "support",
  id: string,
  form: FormData,
) {
  try {
    const actor = await requireAuth(),
      message = String(form.get("response") || "").trim(),
      file = form.get("file");
    if (message.length < 3 || message.length > 5000)
      throw new Error("Enter a response of 3–5000 characters");
    if (!["verification", "support"].includes(kind))
      throw new Error("Unknown case");
    const [owned] = await sql.query(
      kind === "verification"
        ? "select id from verification_requests where id=$1 and user_id=$2 and status='needs_information'"
        : "select id from support_tickets where id=$1 and user_id=$2 and status not in('closed','resolved')",
      [id, actor.uid],
    );
    if (!owned) throw new Error("Case unavailable");
    let attachment: { name: string; url: string } | null = null;
    if (file instanceof File && file.size) {
      if (
        !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        )
      )
        throw new Error("Attach a PDF or supported image");
      attachment = {
        name: file.name.slice(0, 200),
        url: await storeUpload(actor.uid, file, "misc"),
      };
    }
    const files = JSON.stringify(attachment ? [attachment] : []);
    const rows = await sql.query(
      kind === "verification"
        ? "with owned as(update verification_requests set statement=$3,status='pending',updated_at=now(),version=version+1,documents=case when jsonb_array_length($4::jsonb)>0 then $4::jsonb else documents end where id=$1 and user_id=$2 and status='needs_information'returning id)insert into admin_case_events(resource_type,resource_id,actor_id,event_type,message)select 'verification',id,$2,'resubmitted',$3 from owned returning id"
        : "with owned as(update support_tickets set status='awaiting_admin',updated_at=now()where id=$1 and user_id=$2 and status not in('closed','resolved')returning id)insert into admin_case_events(resource_type,resource_id,actor_id,event_type,message,attachments)select 'support',id,$2,'member_reply',$3,$4::jsonb from owned returning id",
      [id, actor.uid, message, files],
    );
    if (!rows.length) throw new Error("Case stopped accepting responses");
    revalidatePath(
      kind === "verification" ? "/verification" : "/support/contact",
    );
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not send response",
    };
  }
}
