import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";
const require = createRequire(import.meta.url);
async function load(path, mocks = {}) {
  const code = ts.transpileModule(await readFile(path, "utf8"), {
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
const catalog = await load("lib/notification-catalog.ts"),
  settings = await load("lib/settings.ts", {
    "./notification-catalog": catalog,
  });
const db = new PGlite();
try {
  for (const file of (await readdir("database/migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort())
    await db.exec(await readFile("database/migrations/" + file, "utf8"));
  await db.exec(
    await readFile("database/migrations/0012_notification_center.sql", "utf8"),
  );
  const sql = {
      query: async (text, args = []) => (await db.query(text, args)).rows,
    },
    neon = {
      sql,
      payload: (value) => value || {},
      iso: (value) => (value ? new Date(value).toISOString() : ""),
    };
  const scalar = async (text, args = []) =>
    Object.values((await sql.query(text, args))[0])[0];
  for (const id of ["a", "b", "c"])
    await sql.query(
      "insert into users(id,email,full_name,username,time_zone,account_status,created_at,onboarded,payload) values($1,$1||'@example.test',$1,$1,'Africa/Lagos','active',now(),true,'{\"preferences\":{\"maxConcurrentExchanges\":20}}')",
      [id],
    );
  const { publicMember } = await load("lib/public-member.ts", {
    "server-only": {},
    "./neon": neon,
    "./settings": settings,
  });
  let viewer = "a";
  const actions = await load("app/actions/notifications.ts", {
    "@/lib/neon": neon,
    "./user": {
      requireAuth: async () => {
        if (!viewer) throw new Error("Unauthorized");
        return { uid: viewer };
      },
      getCurrentUserId: async () => viewer,
    },
    "@/lib/public-member": { publicMember },
    "@/lib/settings": settings,
    "@/lib/notification-catalog": catalog,
  });
  await sql.query(
    "insert into notifications(id,source_path,user_id,notification_type,title,message,created_at,payload) select 'history-'||i,'history/'||i,'a','system','History item '||i,'Routine update',now()-i*interval '1 hour','{}' from generate_series(1,620) i",
  );
  await sql.query(
    "insert into notifications(id,source_path,user_id,notification_type,title,message,created_at,payload) values('other','other','b','system','Private B','Private B',now(),'{}')",
  );
  const first = await actions.getNotifications({ limit: 50 });
  assert.equal(first.success, true, first.error);
  assert.equal(first.total, 620);
  assert.equal(first.hasMore, true);
  const last = await actions.getNotifications({ limit: 50, page: 12 });
  assert.equal(last.notifications.length, 20);
  assert.equal(last.hasMore, false);
  assert.equal(last.notifications.at(-1).id, "history-620");
  const sorted = await actions.getNotifications({ limit: 1, sort: "Oldest" });
  assert.equal(sorted.notifications[0].id, "history-620");
  assert.equal((await actions.getNotificationDetails("other")).success, false);
  assert.equal(
    (
      await actions.bulkUpdateNotifications(["history-1", "other"], {
        isRead: true,
      })
    ).success,
    false,
  );
  assert.equal(
    await scalar("select is_read from notifications where id='history-1'"),
    false,
  );
  assert.equal(
    (await actions.bulkDeleteNotifications(["history-1", "other"])).success,
    false,
  );
  assert.equal(
    await scalar("select count(*) from notifications where id='history-1'"),
    1,
  );
  assert.equal(
    (
      await actions.bulkUpdateNotifications(["history-1", "history-1"], {
        isRead: true,
      })
    ).success,
    true,
  );
  await actions.bulkUpdateNotifications(["history-1"], { isArchived: true });
  assert.equal((await actions.getNotifications({ tab: "archive" })).total, 1);
  await actions.bulkUpdateNotifications(["history-1"], { isArchived: false });
  assert.equal(
    (await actions.getNotifications({ search: "History item 620" }))
      .notifications[0].id,
    "history-620",
  );
  await sql.query(
    "insert into notifications(id,source_path,user_id,notification_type,title,created_at,payload) values('percent','percent','a','system','100% ready',now(),'{}')",
  );
  assert.equal((await actions.getNotifications({ search: "%" })).total, 1);
  const custom = await actions.getNotifications({
    date: "Custom",
    from: "2000-01-01",
    to: "2000-01-02",
  });
  assert.equal(custom.total, 0);
  assert.equal(
    (
      await actions.getNotifications({
        date: "Custom",
        from: "2026-12-01",
        to: "2026-01-01",
      })
    ).success,
    false,
  );
  assert.equal(
    (await actions.getNotifications({ date: "This Week" })).success,
    true,
  );
  assert.equal(
    (await actions.getNotifications({ date: "This Month" })).success,
    true,
  );
  console.log(
    "Complete history beyond 500, server filters and sorting, calendar/custom dates, scoped details, and atomic bulk actions: passed",
  );

  await sql.query(
    "insert into marketplace_requests(id,requester_id,title,status,created_at,payload) values('request','a','Design project','open',now(),'{}')",
  );
  await sql.query(
    "insert into marketplace_applications(id,request_id,applicant_id,status,payload) values('application','request','b','pending','{}')",
  );
  await sql.query(
    'update users set payload=payload||\'{"profileSync":{"syncName":false},"publicProfile":{"fullName":"Public B"},"adminNotes":"private"}\' where id=\'b\'',
  );
  await sql.query(
    "insert into notifications(id,source_path,user_id,notification_type,title,link,related_id,payload) values('application-notif','application-notif','a','application_received','New application','/dashboard/requests/request','request','{\"applicationId\":\"application\",\"actorId\":\"b\"}')",
  );
  await actions.markNotificationAsRead("application-notif");
  let detail = await actions.getNotificationDetails("application-notif");
  assert.equal(detail.notification.requiresAction, true);
  assert.equal(detail.notification.relatedProject.title, "Design project");
  assert.equal(detail.notification.relatedUser.name, "Public B");
  assert.equal(detail.notification.relatedUser.adminNotes, undefined);
  assert.equal(
    (
      await actions.getNotifications({ tab: "actionable", status: "Read" })
    ).notifications.some((n) => n.id === "application-notif"),
    true,
  );
  assert.equal(
    (await actions.acknowledgeNotification("application-notif")).success,
    false,
  );
  await sql.query(
    "update marketplace_applications set status='rejected' where id='application'",
  );
  assert.equal(
    (await actions.getNotificationDetails("application-notif")).notification
      .requiresAction,
    false,
  );
  await sql.query(
    "insert into exchanges(id,requester_id,provider_id,status,title,skill_hours,payload,updated_at) values('exchange','a','b','in_progress','Exchange project',1,'{}',now()-interval '2 days')",
  );
  await sql.query(
    "update exchanges set status='in_review' where id='exchange'",
  );
  const review = await actions.getNotifications({
    category: "Exchanges",
    tab: "actionable",
  });
  assert.ok(review.notifications.some((n) => n.type === "review_waiting"));
  const reviewNotification = review.notifications.find(
    (n) => n.type === "review_waiting",
  );
  await actions.markNotificationAsRead(reviewNotification.id);
  assert.equal(
    (await actions.getNotificationDetails(reviewNotification.id)).notification
      .requiresAction,
    true,
  );
  await sql.query(
    "insert into exchange_review_decisions(id,exchange_id,review_round,reviewer_id,decision) values('decision','exchange',1,'a','accept')",
  );
  assert.equal(
    (await actions.getNotificationDetails(reviewNotification.id)).notification
      .requiresAction,
    false,
  );
  await sql.query(
    "update exchanges set status='completed',completed_at=now() where id='exchange'",
  );
  await sql.query(
    "insert into notifications(id,source_path,user_id,notification_type,title,related_id,payload) values('completed','completed','a','exchange_completed','Exchange completed','exchange','{}')",
  );
  assert.equal(
    (await actions.getNotificationDetails("completed")).notification
      .requiresAction,
    true,
  );
  assert.equal(
    (await actions.getNotificationDetails("completed")).notification.link,
    "/reviews/leave/exchange",
  );
  await sql.query(
    "insert into reviews(id,exchange_id,reviewer_id,target_user_id,rating,payload) values('rating','exchange','a','b',5,'{}')",
  );
  assert.equal(
    (await actions.getNotificationDetails("completed")).notification
      .requiresAction,
    false,
  );
  console.log(
    "Action Required survives reading and resolves from application, review, and exchange state; safe public context: passed",
  );

  const preferences = settings.notificationSettings({});
  preferences.channels.email.announcements = false;
  preferences.channels.inApp.announcements = false;
  preferences.events.email.security_alert = false;
  preferences.events.inApp.security_alert = false;
  preferences.digest = "never";
  const saved = await actions.updateNotificationPreferences(preferences);
  assert.equal(saved.success, true);
  await sql.query(
    "insert into notifications(id,source_path,user_id,notification_type,title,payload) values('security','security','a','security_alert','New sign-in','{}')",
  );
  assert.equal(
    await scalar(
      "select in_app_enabled from notifications where id='security'",
    ),
    true,
  );
  assert.equal(
    await scalar(
      "select count(*) from notification_email_queue where notification_id='security'",
    ),
    1,
  );
  assert.equal(
    (await actions.acknowledgeNotification("security")).success,
    true,
  );
  assert.equal(
    (await actions.getNotificationDetails("security")).notification
      .requiresAction,
    false,
  );
  await sql.query(
    "select record_member_security_state('a','{\"passwordVersion\":1,\"factors\":[]}')",
  );
  await sql.query(
    'select record_member_security_state(\'a\',\'{"passwordVersion":2,"factors":["authenticator"]}\')',
  );
  assert.equal(
    await scalar(
      "select count(*) from notifications where user_id='a' and notification_type='password_updated'",
    ),
    1,
  );
  assert.equal(
    await scalar(
      "select count(*) from notifications where user_id='a' and notification_type='two_factor_enabled'",
    ),
    1,
  );
  await sql.query(
    "select record_member_security_state('a','{\"passwordVersion\":2,\"factors\":[]}')",
  );
  assert.equal(
    await scalar(
      "select count(*) from notifications where user_id='a' and notification_type='two_factor_disabled'",
    ),
    1,
  );
  const eventPreferences = settings.notificationSettings({});
  eventPreferences.events.inApp.community_event = false;
  eventPreferences.events.email.community_event = false;
  assert.equal(
    (await actions.updateNotificationPreferences(eventPreferences)).success,
    true,
  );
  await sql.query(
    "insert into notifications(id,source_path,user_id,notification_type,title,payload) values('event','event','a','community_event','Community event','{}')",
  );
  assert.equal(
    await scalar("select in_app_enabled from notifications where id='event'"),
    false,
  );
  console.log(
    "Mandatory security delivery, per-event preferences, verified password/MFA changes, and acknowledgment: passed",
  );

  await sql.query(
    "insert into billing_accounts(user_id,provider,subscription_status) values('a','paystack','attention')",
  );
  assert.equal(
    await scalar(
      "select count(*) from notifications where user_id='a' and notification_type='payment_failed'",
    ),
    1,
  );
  assert.equal(
    (await actions.getNotifications({ category: "Billing", tab: "actionable" }))
      .total,
    1,
  );
  await sql.query(
    "update billing_accounts set subscription_status='active' where user_id='a'",
  );
  assert.equal(
    (await actions.getNotifications({ category: "Billing", tab: "actionable" }))
      .total,
    0,
  );
  await sql.query(
    "insert into billing_events(id,user_id,provider,event_type,description,amount,currency) values('renewal','a','paystack','renewal','Subscription renewal',10000,'NGN')",
  );
  assert.equal(
    await scalar(
      "select count(*) from notifications where notification_type='subscription_renewed'",
    ),
    1,
  );
  await sql.query(
    "update marketplace_requests set expires_at=now()+interval '12 hours' where id='request'",
  );
  await sql.query("select generate_notification_reminders()");
  const count = await scalar(
    "select count(*) from notifications where source_path like 'reminders/%'",
  );
  await sql.query("select generate_notification_reminders()");
  assert.equal(
    await scalar(
      "select count(*) from notifications where source_path like 'reminders/%'",
    ),
    count,
  );
  const expiry = await actions.getNotifications({
    category: "Marketplace",
    tab: "actionable",
  });
  assert.ok(expiry.notifications.some((n) => n.type === "request_expiring"));
  await sql.query(
    "update marketplace_requests set expires_at=now()+interval '30 days' where id='request'",
  );
  assert.equal(
    (
      await actions.getNotifications({
        category: "Marketplace",
        tab: "actionable",
      })
    ).notifications.some((n) => n.type === "request_expiring"),
    false,
  );
  console.log(
    "Real billing events, payment state resolution, idempotent reminders, and request extensions: passed",
  );

  const { userFromRow } = await load("lib/users.ts", {
    "server-only": {},
    "./neon": neon,
  });
  const metrics = await load("lib/user-metrics.ts"),
    { ACHIEVEMENTS } = await load("lib/constants/achievements.ts");
  let mailWorks = false,
    mailCount = 0;
  const privacy = await load("lib/member-privacy.ts", {
    "server-only": {},
    "./neon": neon,
    "./settings": settings,
    "@/app/actions/user": { getCurrentUserId: async () => viewer },
  });
  await sql.query(
    "update users set country='Nigeria',is_verified=true,payload=payload||'{\"skillsOffered\":[{\"name\":\"React\"}]}' where id in('b','c')",
  );
  await sql.query(
    "update users set country='Nigeria',payload=payload||'{\"skillsLookingFor\":[\"React\"]}' where id='a'",
  );
  await sql.query(
    'update users set payload=payload||\'{"privacy":{"profileVisibility":"hidden"}}\' where id=\'c\'',
  );
  const maintenance = await load("lib/notification-maintenance.ts", {
    "server-only": {},
    "./neon": neon,
    "./users": { userFromRow },
    "./public-member": { publicMember },
    "./user-metrics": metrics,
    "./constants/achievements": { ACHIEVEMENTS },
    "./member-privacy": privacy,
    "./settings": settings,
    "./email": {
      sendEmail: async () => {
        mailCount++;
        return { success: mailWorks };
      },
    },
  });
  await sql.query(
    "insert into notification_announcements(id,event_type,title,message,publish_at) values('announcement','feature_released','New feature','A real platform announcement',now()-interval '1 minute')",
  );
  let activity = await maintenance.generateNotificationActivity();
  assert.equal(activity.failed, 0);
  assert.equal(
    await scalar(
      "select count(*) from notifications where source_path like 'announcement/announcement/%'",
    ),
    3,
  );
  activity = await maintenance.generateNotificationActivity();
  assert.equal(activity.announcements, 0);
  assert.ok(
    await scalar("select count(*) from notification_achievement_awards"),
  );
  assert.equal(
    await scalar(
      "select count(*) from notifications where user_id='a' and notification_type='new_professional' and related_id='b'",
    ),
    1,
  );
  assert.equal(
    await scalar(
      "select count(*) from notifications where user_id='a' and notification_type='new_professional' and related_id='c'",
    ),
    0,
  );
  const digestPreferences = settings.notificationSettings({});
  digestPreferences.dailySummary = { enabled: true, time: "00:00" };
  await sql.query(
    "update users set payload=payload||jsonb_build_object('notificationPreferences',$2::jsonb) where id=$1",
    ["a", JSON.stringify(digestPreferences)],
  );
  assert.deepEqual(await maintenance.deliverProductivityDigests(), {
    sent: 0,
    failed: 1,
  });
  assert.deepEqual(await maintenance.deliverProductivityDigests(), {
    sent: 0,
    failed: 0,
  });
  assert.equal(mailCount, 1);
  mailWorks = true;
  await sql.query(
    "update notification_digest_deliveries set claimed_at=now()-interval '20 minutes'",
  );
  assert.deepEqual(await maintenance.deliverProductivityDigests(), {
    sent: 1,
    failed: 0,
  });
  assert.deepEqual(await maintenance.deliverProductivityDigests(), {
    sent: 0,
    failed: 0,
  });
  assert.equal(mailCount, 2);
  const summary = await maintenance.productivitySummary("a");
  assert.equal(summary.reviews, 0);
  assert.ok(maintenance.summaryHtml(summary).includes("unread messages"));
  assert.equal(
    catalog.groupNotifications(
      [
        {
          id: "1",
          groupKey: "exchange:test",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          groupKey: "exchange:test",
          createdAt: new Date(Date.now() - 60000).toISOString(),
          requiresAction: true,
        },
      ],
      true,
    ).length,
    1,
  );

  // Invalid credentials are independently verified. Client assertions cannot generate a security alert.
  const failedSignIn = await load("app/api/auth/failed-sign-in/route.ts", {
    "@/lib/neon": neon,
    "@/lib/settings": settings,
  });
  const originalFetch = globalThis.fetch,
    oldKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    oldOrigin = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-only";
  process.env.NEXT_PUBLIC_APP_URL = "https://weave.example.test";
  const report = () =>
    new Request("https://weave.example.test/api/auth/failed-sign-in", {
      method: "POST",
      headers: {
        origin: "https://weave.example.test",
        "content-type": "application/json",
        "cf-connecting-ip": "test",
      },
      body: JSON.stringify({
        email: "b@example.test",
        password: "invalid-test-password",
      }),
    });
  try {
    globalThis.fetch = async () => Response.json({ localId: "b" });
    for (let i = 0; i < 5; i++)
      assert.equal((await failedSignIn.POST(report())).status, 204);
    assert.equal(
      await scalar(
        "select count(*) from notifications where user_id='b' and notification_type='failed_login_attempts'",
      ),
      0,
    );
    globalThis.fetch = async () =>
      Response.json(
        { error: { message: "INVALID_LOGIN_CREDENTIALS" } },
        { status: 400 },
      );
    for (let i = 0; i < 7; i++) await failedSignIn.POST(report());
    assert.equal(
      await scalar(
        "select count(*) from notifications where user_id='b' and notification_type='failed_login_attempts'",
      ),
      1,
    );
    let called = false;
    globalThis.fetch = async () => {
      called = true;
      throw Error("Should not fetch");
    };
    await failedSignIn.POST(
      new Request("https://weave.example.test/api/auth/failed-sign-in", {
        method: "POST",
        headers: { origin: "https://other.example.test" },
        body: "{}",
      }),
    );
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    else process.env.NEXT_PUBLIC_FIREBASE_API_KEY = oldKey;
    if (oldOrigin === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = oldOrigin;
  }
  await sql.query(
    "insert into marketplace_requests(id,requester_id,title,status,expires_at,payload) values('expired','a','Expired request','open',now()-interval '1 minute','{}')",
  );
  await assert.rejects(
    () =>
      sql.query(
        "insert into marketplace_applications(id,request_id,applicant_id,status,payload) values('late','expired','b','pending','{}')",
      ),
    /expired/,
  );
  await assert.rejects(
    () =>
      sql.query(
        "insert into exchanges(id,requester_id,provider_id,marketplace_request_id,status,skill_hours,payload) values('late-exchange','a','b','expired','in_progress',1,'{}')",
      ),
    /expired/,
  );
  // Reviews emit one real Trust Score transition via the account trigger, including duplicate protection.
  const reviewActions = await load("app/actions/reviews.ts", {
    "@/lib/neon": neon,
    "@/lib/notification-email": { scheduleNotificationEmails() {} },
    "next/cache": { revalidatePath() {} },
    "./user": { getCurrentUserId: async () => "b" },
  });
  const scoreEvents = await scalar(
    "select count(*) from notifications where user_id='a' and notification_type='trust_score_increased'",
  );
  const input = {
    rating: 5,
    communication: 5,
    quality: 5,
    timeliness: 5,
    professionalism: 5,
    wouldCollaborateAgain: true,
    comment: "Excellent collaboration",
    skillEndorsements: ["React"],
    privateFeedback: "Private feedback",
  };
  const submitted = await reviewActions.submitReview("exchange", "a", input);
  assert.equal(submitted.success, true, submitted.error);
  assert.equal(
    await scalar(
      "select count(*) from notifications where user_id='a' and notification_type='trust_score_increased'",
    ),
    Number(scoreEvents) + 1,
  );
  assert.equal(
    (await reviewActions.submitReview("exchange", "a", input)).success,
    false,
  );
  assert.equal(
    await scalar(
      "select count(*) from notifications where user_id='a' and notification_type='trust_score_increased'",
    ),
    Number(scoreEvents) + 1,
  );
  console.log(
    "Real review and endorsement producers, single Trust Score updates, and duplicate review protection: passed",
  );
  // Account cleanup erases delivery records as part of the existing anonymization transaction.
  await sql.query("update users set account_status='deleted' where id='a'");
  assert.equal(
    await scalar(
      "select count(*) from notification_digest_deliveries where user_id='a'",
    ),
    0,
  );
  assert.equal(
    await scalar(
      "select count(*) from notification_achievement_awards where user_id='a'",
    ),
    0,
  );
  console.log(
    "Verified failed-sign-in reports, private matching, immediate request expiry, and deletion cleanup: passed",
  );
  viewer = null;
  assert.equal((await actions.getNotifications()).success, false);
  console.log(
    "Scheduled announcements, achievement awards, grouping, digest claims and failure/retry, and unauthenticated access: passed",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await db.close();
}
