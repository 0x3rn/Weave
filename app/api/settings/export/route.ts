import { requireAuth } from "@/app/actions/user";
import { sql } from "@/lib/neon";
import { getUserById } from "@/lib/users";
import { gzipSync } from "node:zlib";
import { object } from "@/lib/settings";
export async function GET(request: Request) {
  try {
    const { uid } = await requireAuth();
    const kind = new URL(request.url).searchParams.get("kind") || "everything";
    if (
      ![
        "profile",
        "ledger",
        "reviews",
        "messages",
        "portfolio",
        "everything",
        "backup",
      ].includes(kind)
    )
      return Response.json({ error: "Unknown export" }, { status: 400 });
    const all = kind === "everything" || kind === "backup";
    const output: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      formatVersion: 1,
    };
    if (all || kind === "profile") {
      const user = await getUserById(uid);
      const fields = [
        "uid",
        "email",
        "username",
        "fullName",
        "displayName",
        "phone",
        "photoURL",
        "country",
        "timeZone",
        "language",
        "profession",
        "headline",
        "bio",
        "languages",
        "experienceLevel",
        "availability",
        "schedule",
        "skillsOffered",
        "skillsLookingFor",
        "preferredCollaboration",
        "portfolioWebsite",
        "github",
        "linkedIn",
        "behance",
        "dribbble",
        "youtube",
        "twitter",
        "otherLink",
        "createdAt",
        "lastActive",
        "skillHours",
        "trustScore",
        "stats",
        "achievements",
        "isVerified",
        "subscriptionTier",
        "privacy",
        "preferences",
        "profileSync",
        "publicProfile",
        "notificationPreferences",
        "dataRetention",
        "marketplacePaused",
      ];
      output.profile = Object.fromEntries(
        fields
          .filter((key) => user && key in user)
          .map((key) => [key, user![key]]),
      );
    }
    if (all || kind === "ledger")
      output.ledger = await sql.query(
        "select id,exchange_id,entry_type,entry_status,amount,balance_before,balance_after,description,occurred_at from ledger_entries where user_id=$1 order by occurred_at",
        [uid],
      );
    if (all || kind === "reviews")
      output.reviews = await sql.query(
        "select id,exchange_id,reviewer_id,target_user_id,rating,comment,created_at from reviews where target_user_id=$1 or reviewer_id=$1 order by created_at",
        [uid],
      );
    if (all || kind === "portfolio")
      output.portfolio = await sql.query(
        "select id,title,description,image_url,link,technologies,created_at from portfolio_items where user_id=$1",
        [uid],
      );
    if (all || kind === "messages") {
      output.messages = await sql.query(
        "select m.id,m.conversation_id,m.sender_id,m.message_type,m.content,m.created_at,m.metadata from messages m join conversation_participants p on p.conversation_id=m.conversation_id where p.user_id=$1 order by m.created_at",
        [uid],
      );
      output.attachments = await sql.query(
        "select a.id,a.message_id,a.original_name,a.content_type,a.size_bytes,a.object_key from message_attachments a join conversation_participants p on p.conversation_id=a.conversation_id where p.user_id=$1",
        [uid],
      );
      output.notes = await sql.query(
        "select conversation_id,content,updated_at from conversation_notes where user_id=$1",
        [uid],
      );
    }
    if (all) {
      const groups = await Promise.all([
        sql.query(
          "select id,title,description,status,created_at,updated_at from marketplace_requests where requester_id=$1",
          [uid],
        ),
        sql.query(
          "select id,request_id,cover_message,portfolio_links,availability,status,created_at from marketplace_applications where applicant_id=$1",
          [uid],
        ),
        sql.query(
          "select id,receiver_id,skill_needed,date_options,time_needed,hours_needed,message,status,created_at from exchange_requests where sender_id=$1",
          [uid],
        ),
        sql.query(
          "select id,title,status,is_mutual,skill_hours,deadline_at,created_at,completed_at from exchanges where $1 in(requester_id,provider_id)",
          [uid],
        ),
        sql.query(
          "select exchange_id,content,updated_at from exchange_notes where user_id=$1",
          [uid],
        ),
        sql.query(
          "select provider,account_name,profile_url,permissions,connected_at,last_used_at from user_integrations where user_id=$1",
          [uid],
        ),
        sql.query(
          "select blocked_id,reason,created_at from blocked_users where blocker_id=$1",
          [uid],
        ),
        sql.query(
          "select id,os,browser,device_type,ip,last_active_at from user_devices where user_id=$1",
          [uid],
        ),
        sql.query(
          "select id,title,message,notification_type,created_at,is_read,is_archived from notifications where user_id=$1",
          [uid],
        ),
        sql.query(
          "select target_id,target_type,saved_at from saved_items where user_id=$1",
          [uid],
        ),
        sql.query(
          "select id,description,event_type,amount,currency,occurred_at from billing_events where user_id=$1",
          [uid],
        ),
        sql.query(
          "select provider,subscription_status,renewal_at,amount,currency,payment_method from billing_accounts where user_id=$1",
          [uid],
        ),
      ]);
      [
        "requests",
        "applications",
        "exchangeRequests",
        "exchanges",
        "exchangeNotes",
        "integrations",
        "blockedMembers",
        "devices",
        "notifications",
        "savedItems",
        "billingHistory",
        "billing",
      ].forEach((key, index) => (output[key] = groups[index]));
      output.billing = groups[11].map((row) => {
        const method = object(row.payment_method);
        return {
          ...row,
          payment_method: {
            brand: method.brand,
            last4: method.last4,
            expMonth: method.expMonth,
            expYear: method.expYear,
          },
        };
      });
    }
    const json = JSON.stringify(output, null, 2),
      body = kind === "backup" ? new Uint8Array(gzipSync(json)) : json;
    return new Response(body, {
      headers: {
        "content-type":
          kind === "backup"
            ? "application/gzip"
            : "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="weave-${kind}.${kind === "backup" ? "json.gz" : "json"}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const unauthorized =
      error instanceof Error &&
      /authenticated|session|signed out|unavailable/i.test(error.message);
    return Response.json(
      {
        error: unauthorized
          ? "Sign in again to export your data."
          : "Unable to export your data. Please retry.",
      },
      { status: unauthorized ? 401 : 500 },
    );
  }
}
