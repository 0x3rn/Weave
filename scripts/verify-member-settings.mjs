import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";
import { createHmac, createHash } from "node:crypto";

const require = createRequire(import.meta.url);
async function loadModule(path, mocks = {}) {
  const source = await readFile(path, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => (Object.hasOwn(mocks, name) ? mocks[name] : require(name)),
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const catalog = await loadModule("lib/notification-catalog.ts");
const settings = await loadModule("lib/settings.ts",{"./notification-catalog":catalog});
assert.equal(settings.settingsFor("privacy", {}).showSkillHourBalance, false);
assert.equal(
  settings.settingsFor("preferences", { maxConcurrentExchanges: "bad" })
    .maxConcurrentExchanges,
  3,
);
assert.throws(
  () =>
    settings.validateSettingsPatch("preferences", {
      maxConcurrentExchanges: 0,
    }),
  /Invalid/,
);
assert.throws(
  () => settings.validateSettingsPatch("privacy", { isAdmin: true }),
  /Invalid/,
);
assert.throws(
  () => settings.validateSettingsPatch("privacy", { showTrustScore: "false" }),
  /Invalid/,
);
assert.deepEqual(
  settings.validateSettingsPatch("privacy", { showTrustScore: false }),
  { showTrustScore: false },
);
const prefs = settings.notificationSettings({
  deliveryMethod: { inApp: true, email: true },
  messages: false,
});
assert.equal(prefs.channels.email.messages, false);
assert.equal(prefs.channels.email.escrow, true);
prefs.quietHours = {
  enabled: true,
  start: "22:00",
  end: "07:00",
  timeZone: "Africa/Lagos",
};
assert.equal(
  settings.inQuietHours(prefs, new Date("2026-10-05T21:30:00Z")),
  true,
);
assert.equal(
  settings.inQuietHours(prefs, new Date("2026-10-06T06:00:00Z")),
  false,
);
assert.equal(
  settings.notificationCategory("trust_score_changed"),
  "trustScore",
);
console.log(
  "Settings validation, legacy preferences, and time zone quiet hours: passed",
);

const { SaveQueue } = await loadModule("lib/save-queue.ts");
const saveQueue = new SaveQueue();
let attempts = 0;
const order = [];
const failedSave = () => {
  attempts++;
  order.push("first");
  return Promise.resolve(
    attempts === 1 ? { success: false, error: "Offline" } : { success: true },
  );
};
await Promise.all([
  saveQueue.save(failedSave),
  saveQueue.save(async () => {
    order.push("second");
    return { success: true };
  }),
]);
assert.deepEqual(order, ["first", "second"]);
assert.equal(saveQueue.hasFailures, true);
assert.equal(saveQueue.error, "Offline");
assert.equal(saveQueue.pending, 0);
for (const retry of saveQueue.takeFailures()) await saveQueue.save(retry);
assert.equal(saveQueue.hasFailures, false);
assert.equal(saveQueue.error, "");

let deviceCookie = "owned-device",
  deviceHash = createHash("sha256").update("session-cookie").digest("hex");
const authenticated = await loadModule("app/actions/user.ts", {
  "@/lib/firebase-auth-server": {
    verifyFirebaseSessionCookie: async () => ({ uid: "a" }),
  },
  "@/lib/neon": {
    sql: {
      query: async (text) =>
        text.includes("user_devices")
          ? deviceHash
            ? [{ session_hash: deviceHash }]
            : []
          : [{ status: "active" }],
    },
  },
  "@/lib/neon-storage": {},
  "next/headers": {
    cookies: async () => ({
      get: (key) =>
        key === "session"
          ? { value: "session-cookie" }
          : deviceCookie
            ? { value: deviceCookie }
            : undefined,
    }),
  },
  "next/cache": { revalidatePath() {} },
  "@/lib/settings": settings,
});
assert.equal((await authenticated.requireAuth()).uid, "a");
deviceHash = "another-session-hash";
await assert.rejects(authenticated.requireAuth(), /signed out/);
deviceCookie = "";
await assert.rejects(authenticated.requireAuth(), /register/);
console.log(
  "Serialized saving, failed-save retry, and device/session binding: passed",
);

const neonMock = {
  payload: (value) => value || {},
  iso: (value) => (value ? new Date(value).toISOString() : ""),
};
const { publicMember } = await loadModule("lib/public-member.ts", {
  "server-only": {},
  "./neon": neonMock,
  "./settings": settings,
});
const member = publicMember({
  id: "member",
  full_name: "Private new name",
  photo_url: "private-new.jpg",
  email: "secret@example.test",
  skill_hours: 900,
  is_verified: true,
  payload: {
    adminNotes: "private",
    phone: "private",
    publicProfile: { fullName: "Public name", photoURL: "public.jpg" },
    profileSync: {
      syncName: false,
      syncPhoto: false,
      showVerification: false,
      showOnlineStatus: false,
      showAvailability: false,
    },
    privacy: {
      showTrustScore: false,
      showPortfolio: false,
      showReviews: false,
      showCompletedExchanges: false,
    },
    stats: { rating: 5, exchangesCompleted: 40, skillHoursEarned: 900 },
    schedule: { private: true },
  },
});
assert.equal(member.fullName, "Public name");
assert.equal(member.photoURL, "public.jpg");
assert.equal(member.isVerified, false);
assert.equal(member.trustScore, 0);
assert.equal(member.skillHours, undefined);
assert.equal(member.email, "");
assert.equal(member.schedule, undefined);
assert.equal(member.stats.rating, 0);
assert.equal(member.stats.exchangesCompleted, 0);
assert.equal(member.stats.skillHoursEarned, 0);
assert.equal(member.adminNotes, undefined);
console.log("Public profile projection and sync snapshots: passed");

const db = new PGlite();
try {
  for (const file of (await readdir("database/migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(`database/migrations/${file}`, "utf8"));
  await db.exec(
    await readFile("database/migrations/0011_member_settings.sql", "utf8"),
  );
  await db.exec(await readFile("database/migrations/0012_notification_center.sql","utf8"));
  const query = (sql, args = []) => db.query(sql, args);
  const scalar = async (sql, args = []) =>
    Object.values((await query(sql, args)).rows[0])[0];
  for (const uid of ["a", "b", "c", "d", "e", "f", "paid"])
    await query(
      "insert into users(id,full_name,email,account_status,payload) values($1,$1,$1||'@example.test','active','{}')",
      [uid],
    );
  const sqlAdapter = {
    query: async (text, args = []) => (await db.query(text, args)).rows,
  };
  let viewer = "f";
  const privacy = await loadModule("lib/member-privacy.ts", {
    "server-only": {},
    "./neon": { sql: sqlAdapter },
    "./settings": settings,
    "@/app/actions/user": { getCurrentUserId: async () => viewer },
  });
  await query(
    'update users set payload=\'{"privacy":{"profileVisibility":"members"}}\' where id=\'f\'',
  );
  viewer = null;
  assert.equal(await privacy.profileAccess("f"), null);
  viewer = "a";
  assert.ok(await privacy.profileAccess("f"));
  await query(
    "insert into blocked_users(blocker_id,blocked_id) values('f','a')",
  );
  assert.equal(await privacy.profileAccess("f"), null);
  await query("delete from blocked_users");
  await query(
    'update users set payload=\'{"privacy":{"profileVisibility":"hidden"}}\' where id=\'f\'',
  );
  assert.equal(await privacy.profileAccess("f"), null);
  viewer = "f";
  assert.equal((await privacy.profileAccess("f")).owner, true);
  await query("update users set payload='{}' where id='f'");
  const userActions = await loadModule("app/actions/user.ts", {
    "@/lib/firebase-auth-server": {
      verifyFirebaseSessionCookie: async () => ({ uid: "f" }),
    },
    "@/lib/neon": { sql: sqlAdapter },
    "@/lib/neon-storage": {},
    "next/headers": {
      cookies: async () => ({
        get: (key) => ({
          value: key === "session" ? "session-cookie" : "f-device",
        }),
      }),
    },
    "next/cache": { revalidatePath() {} },
    "@/lib/settings": settings,
  });
  await query(
    "insert into user_devices(id,user_id,payload) values('f-device','f',jsonb_build_object('sessionHash',$1::text))",
    [createHash("sha256").update("session-cookie").digest("hex")],
  );
  const actions = await loadModule("app/actions/settings.ts", {
    "./user": { requireAuth: async () => ({ uid: "f" }) },
    "@/lib/neon": { sql: sqlAdapter },
    "@/lib/settings": settings,
    "@/lib/public-member": { publicMember },
    "next/cache": { revalidatePath() {} },
    "@/lib/firebase-auth-server": {},
  });
  assert.equal(
    (
      await actions.saveSettings("profileSync", {
        syncName: false,
        syncPhoto: false,
      })
    ).success,
    true,
  );
  assert.equal(
    (await userActions.updateUserProfile({ displayName: "Private F" })).success,
    true,
  );
  assert.equal(
    await scalar(
      "select payload->'publicProfile'->>'fullName' from users where id='f'",
    ),
    "f",
  );
  const form = new FormData();
  form.set("fullName", "Public F");
  form.set("headline", "Headline");
  form.set("bio", "Bio");
  form.set("availability", "Available");
  assert.equal((await userActions.saveProfileSettings(form)).success, true);
  assert.equal(
    await scalar("select full_name from users where id='f'"),
    "Private F",
  );
  assert.equal(
    await scalar(
      "select payload->'publicProfile'->>'fullName' from users where id='f'",
    ),
    "Public F",
  );
  assert.equal(await scalar("select full_name from users where id='a'"), "a");
  assert.equal(
    (await userActions.updateUserProfile({ privacy: true })).success,
    undefined,
  );
  console.log(
    "Profile visibility, bilateral blocking, account-scoped writes, and independent public/account names: passed",
  );
  await query("update users set payload=$2::jsonb where id=$1", [
    "b",
    JSON.stringify({
      preferences: { maxConcurrentExchanges: 1, openToReciprocalOnly: true },
    }),
  ]);
  await assert.rejects(
    query(
      "insert into exchanges(id,requester_id,provider_id,status,is_mutual,payload) values('oneway','a','b','in_progress',false,'{}')",
    ),
    /reciprocal/,
  );
  await query(
    "insert into exchanges(id,requester_id,provider_id,status,is_mutual,payload) values('swap','a','b','in_progress',true,'{}')",
  );
  await assert.rejects(
    query(
      "insert into exchanges(id,requester_id,provider_id,status,is_mutual,payload) values('second','c','b','in_progress',true,'{}')",
    ),
    /concurrent/,
  );
  await assert.rejects(
    query("select change_member_account_state('a','delete')"),
    /active exchanges/,
  );
  await query("select change_member_account_state('c','pause')");
  assert.equal(
    await scalar(
      "select payload->>'marketplacePaused' from users where id='c'",
    ),
    "true",
  );
  await query("select change_member_account_state('c','resume')");
  assert.equal(
    await scalar(
      "select payload->>'marketplacePaused' from users where id='c'",
    ),
    "false",
  );
  await query(
    "insert into user_devices(id,user_id,payload) values('device','c','{}')",
  );
  await query("select change_member_account_state('c','deactivate')");
  assert.equal(
    await scalar("select count(*) from user_devices where user_id='c'"),
    0,
  );
  await query(
    "insert into billing_accounts(user_id,provider,subscription_status) values('paid','paystack','attention')",
  );
  await assert.rejects(
    query("select change_member_account_state('paid','delete')"),
    /subscription/,
  );

  await query(
    "insert into conversations(id,conversation_type,payload) values('direct','direct','{}')",
  );
  await query(
    "insert into conversation_participants(conversation_id,user_id) values('direct','d'),('direct','e')",
  );
  await query(
    'update users set payload=\'{"privacy":{"contactPreferences":"verified"}}\' where id=\'e\'',
  );
  await assert.rejects(
    query(
      "insert into messages(id,conversation_id,sender_id,message_type,content,payload) values('blocked-contact','direct','d','text','Hello','{}')",
    ),
    /accepting contact/,
  );
  await query("update users set is_verified=true where id='d'");
  await query(
    "insert into messages(id,conversation_id,sender_id,message_type,content,created_at,payload) values('message','direct','d','text','Hello',now(),'{}')",
  );
  await query(
    "insert into blocked_users(blocker_id,blocked_id,reason) values('e','d','Unwanted contact')",
  );
  await assert.rejects(
    query(
      "insert into messages(id,conversation_id,sender_id,message_type,content,payload) values('blocked-message','direct','d','text','Hello','{}')",
    ),
    /Messaging/,
  );
  await query("delete from blocked_users");
  const preferences = settings.notificationSettings({});
  preferences.channels.inApp.messages = false;
  preferences.channels.email.messages = true;
  preferences.events.inApp.message_received = false;
  preferences.events.email.message_received = true;
  preferences.digest = "daily";
  preferences.quietHours.timeZone = "Africa/Lagos";
  await query(
    "update users set payload=jsonb_build_object('notificationPreferences',$2::jsonb) where id=$1",
    ["e", JSON.stringify(preferences)],
  );
  await query(
    "insert into notifications(id,source_path,user_id,notification_type,title,created_at,payload) values('notif','notif','e','message_received','Message',now(),'{}')",
  );
  assert.equal(
    await scalar("select in_app_enabled from notifications where id='notif'"),
    false,
  );
  assert.equal(
    await scalar(
      "select due_at>now() from notification_email_queue where notification_id='notif'",
    ),
    true,
  );
  preferences.digest = "never";
  await query(
    "update users set payload=jsonb_build_object('notificationPreferences',$2::jsonb) where id=$1",
    ["e", JSON.stringify(preferences)],
  );
  await query(
    "insert into notifications(id,source_path,user_id,notification_type,payload) values('never','never','e','message_received','{}')",
  );
  assert.equal(
    await scalar(
      "select count(*) from notification_email_queue where notification_id='never'",
    ),
    0,
  );

  preferences.digest = "instant";
  await query(
    "update users set payload=jsonb_build_object('notificationPreferences',$2::jsonb) where id=$1",
    ["e", JSON.stringify(preferences)],
  );
  await query(
    "update notification_email_queue set due_at=now()-interval '1 minute' where notification_id='notif'",
  );
  let mailWorks = false,
    lastMail;
  const delivery = await loadModule("lib/notification-email.ts", {
    "server-only": {},
    "next/server": { after() {} },
    "@/lib/neon": { sql: sqlAdapter },
    "@/lib/email": {
      sendEmail: async (mail) => {
        lastMail = mail;
        return mailWorks
          ? { success: true }
          : { success: false, error: "Simulated SMTP failure" };
      },
    },
    "./settings": settings,
    "./notification-catalog": catalog,
    "./notification-maintenance": {productivitySummary:async()=>({}),summaryHtml:()=>""},
  });
  assert.deepEqual(await delivery.deliverNotificationEmails(), {
    sent: 0,
    failed: 1,
  });
  assert.equal(
    await scalar(
      "select sent_at from notification_email_queue where notification_id='notif'",
    ),
    null,
  );
  assert.equal(
    await scalar(
      "select attempts from notification_email_queue where notification_id='notif'",
    ),
    1,
  );
  mailWorks = true;
  await query(
    "update notification_email_queue set due_at=now()-interval '1 minute' where notification_id='notif'",
  );
  assert.deepEqual(await delivery.deliverNotificationEmails(), {
    sent: 1,
    failed: 0,
  });
  assert.equal(lastMail.to, "e@example.test");
  assert.ok(
    await scalar(
      "select sent_at from notification_email_queue where notification_id='notif'",
    ),
  );
  console.log(
    "Email failure/retry preserves queued notifications until delivery succeeds: passed",
  );

  const first = (
    await query(
      "select * from reserve_member_checkout('f','checkout1',10000,'NGN','PLN_test')",
    )
  ).rows[0];
  const duplicate = (
    await query(
      "select * from reserve_member_checkout('f','checkout2',10000,'NGN','PLN_test')",
    )
  ).rows[0];
  assert.equal(first.reference, duplicate.reference);
  await assert.rejects(
    query(
      "select * from reserve_member_checkout('paid','paidcheckout',10000,'NGN','PLN_test')",
    ),
    /current subscription/,
  );

  const oldFetch = globalThis.fetch,
    oldKey = process.env.PAYSTACK_SECRET_KEY;
  try {
    process.env.PAYSTACK_SECRET_KEY = "settings-test-key";
    let amount = 9999,
      providerCalls = 0;
    globalThis.fetch = async (url) => {
      providerCalls++;
      return Response.json({
        status: true,
        data: String(url).includes("/transaction/verify/")
          ? {
              status: "success",
              reference: "checkout1",
              amount,
              currency: "NGN",
              customer: { id: 123, customer_code: "CUS_test" },
              authorization: { last4: "0001" },
            }
          : [
              {
                subscription_code: "SUB_test",
                status: "active",
                plan: { plan_code: "PLN_test", amount: 10000, currency: "NGN" },
              },
            ],
      });
    };
    const billing = await loadModule("lib/billing.ts", {
      "server-only": {},
      "./settings": settings,
      "./neon": {
        sql: {
          ...sqlAdapter,
          transaction: (factory) =>
            db.transaction(async (tx) =>
              Promise.all(
                factory({
                  query: async (text, args) =>
                    (await tx.query(text, args)).rows,
                }),
              ),
            ),
        },
      },
    });
    await assert.rejects(billing.verifyCheckout("checkout1", "a"), /Unknown/);
    assert.equal(providerCalls, 0);
    await assert.rejects(
      billing.verifyCheckout("checkout1", "f"),
      /not been verified/,
    );
    assert.equal(
      await scalar("select count(*) from billing_accounts where user_id='f'"),
      0,
    );
    amount = 10000;
    assert.deepEqual(await billing.verifyCheckout("checkout1", "f"), {
      userId: "f",
    });
    assert.equal(
      await scalar(
        "select payload->>'subscriptionTier' from users where id='f'",
      ),
      "verified",
    );
    assert.equal(
      await scalar("select count(*) from billing_events where id='checkout1'"),
      1,
    );
    const callsBefore = providerCalls;
    await billing.verifyCheckout("checkout1", "f");
    assert.equal(providerCalls, callsBefore);
    let webhookReads = 0;
    const webhook = await loadModule("app/api/billing/webhook/route.ts", {
      "@/lib/settings": settings,
      "@/lib/neon": {
        sql: {
          query: async () => {
            webhookReads++;
            return [];
          },
        },
      },
      "@/lib/billing": {
        verifyCheckout() {
          throw new Error("Unexpected verification");
        },
        refreshSubscription() {
          throw new Error("Unexpected refresh");
        },
      },
    });
    const body = JSON.stringify({ event: "ignored", data: {} });
    assert.equal(
      (
        await webhook.POST(
          new Request("https://weave.example.test/api/billing/webhook", {
            method: "POST",
            body,
            headers: { "x-paystack-signature": "0".repeat(128) },
          }),
        )
      ).status,
      401,
    );
    assert.equal(webhookReads, 0);
    const signature = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");
    assert.equal(
      (
        await webhook.POST(
          new Request("https://weave.example.test/api/billing/webhook", {
            method: "POST",
            body,
            headers: { "x-paystack-signature": signature },
          }),
        )
      ).status,
      200,
    );
    console.log(
      "Payment ownership, amount verification, idempotency, and webhook signatures: passed",
    );
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = oldKey;
  }

  await query("select change_member_account_state('d','delete')");
  assert.equal(
    (await query("select * from claim_member_deletions()")).rows.length,
    0,
  );
  await assert.rejects(
    query("select finalize_member_deletion('d')"),
    /not due/,
  );
  await query(
    "update account_deletion_requests set delete_after=now()-interval '1 day' where user_id='d'",
  );
  const claimed = (await query("select * from claim_member_deletions()")).rows;
  assert.equal(claimed[0].user_id, "d");
  assert.equal(
    await scalar("select account_status from users where id='d'"),
    "deletion_processing",
  );
  assert.equal(
    (await query("select * from claim_member_deletions()")).rows.length,
    0,
  );
  await assert.rejects(
    query("select finalize_member_deletion('d')"),
    /cleanup is incomplete/,
  );
  await query(
    "update account_deletion_requests set auth_deleted_at=now(),storage_deleted_at=now() where user_id='d'",
  );
  await query("select finalize_member_deletion('d')");
  assert.equal(
    await scalar("select account_status from users where id='d'"),
    "deleted",
  );
  assert.equal(await scalar("select email from users where id='d'"), null);
  assert.equal(
    await scalar("select content from messages where id='message'"),
    "[Deleted member message]",
  );
  console.log(
    "All migrations and rerun, contact restrictions, exchange limits, notification queue, checkout reservation, and deletion lifecycle: passed",
  );
} finally {
  await db.close();
}
