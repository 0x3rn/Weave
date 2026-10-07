import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";
const require = createRequire(import.meta.url),
  db = new PGlite();
let uid = "super",
  checks = 0;
async function load(file, mocks = {}) {
  const module = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    ts.transpileModule(await readFile(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
  )(
    (name) => (Object.hasOwn(mocks, name) ? mocks[name] : require(name)),
    module,
    module.exports,
  );
  return module.exports;
}
async function check(name, fn) {
  await fn();
  console.log("PASS", name);
  checks++;
}
try {
  for (const file of (await readdir("database/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile("database/migrations/" + file, "utf8"));
  await db.exec(
    await readFile("database/migrations/0014_admin_operations.sql", "utf8"),
  );
  const sql = { query: async (q, args = []) => (await db.query(q, args)).rows },
    neon = {
      sql,
      iso: (v) => (v instanceof Date ? v.toISOString() : String(v || "")),
      payload: (v) => (v && typeof v === "object" ? v : {}),
    };
  const types = await load("lib/admin-ops-types.ts");
  const access = await load("lib/admin-ops-access.ts", {
    "server-only": {},
    "./neon": neon,
    "./admin-ops-types": types,
    "@/app/actions/user": {
      requireAuth: async () => ({ uid, auth_time: Date.now() / 1000 }),
    },
    "next/headers": { headers: async () => new Headers() },
  });
  const data = await load("lib/admin-ops-data.ts", {
    "server-only": {},
    "./neon": neon,
    "./admin-ops-types": types,
    "./admin-ops-access": access,
  });
  const analytics = await load("lib/admin-analytics.ts", {
    "server-only": {},
    "./neon": neon,
    "./admin-ops-access": access,
  });
  const nav = await load("app/actions/admin/navigation.ts", {
    "@/lib/neon": neon,
    "@/lib/admin-ops-access": access,
    "@/lib/admin-ops-types": types,
  });
  const mutate = (
    area,
    id,
    action,
    data = {},
    actor = uid,
    reason = "Reviewed operation",
    operation = crypto.randomUUID(),
  ) =>
    sql.query("select admin_ops_mutate($1,$2,$3,$4,$5::jsonb,$6,$7)as result", [
      actor,
      area,
      id,
      action,
      JSON.stringify(data),
      reason,
      operation,
    ]);
  await db.exec(
    "insert into users(id,email,role,account_status,full_name,skill_hours,created_at,payload)values('super','super@example.test','Admin','active','Super',0,now(),'{}'),('ops','ops@example.test','Member','active','Operations',0,now(),'{}'),('support','support@example.test','Member','active','Support',0,now(),'{}'),('finance','finance@example.test','Member','active','Finance',0,now(),'{}'),('content','content@example.test','Member','active','Content',0,now(),'{}'),('analyst','analyst@example.test','Member','active','Analyst',0,now(),'{}'),('a','a@example.test','Member','active','Member A',10,now(),'{}'),('b','b@example.test','Member','active','Member B',7,now(),'{}');insert into admin_staff_roles(user_id,role_name)values('ops','Operations Admin'),('support','Support Admin'),('finance','Finance Admin'),('content','Content Admin'),('analyst','Analyst');",
  );
  await check(
    "all operational readers execute on the migrated schema",
    async () => {
      for (const area of types.ADMIN_AREAS.filter(
        (a) => !["analytics", "settings"].includes(a),
      ))
        await data.getAdminList(area);
      await analytics.getAdminAnalytics();
      await nav.searchAdmin("member");
      await nav.adminAlerts();
    },
  );
  await check(
    "role permissions deny legacy management and cross-area writes",
    async () => {
      uid = "support";
      await assert.rejects(access.adminSession("legacy.manage"), /Forbidden/);
      await assert.rejects(
        mutate("skill-ledger", "new", "adjust", {
          memberId: "a",
          amount: 5,
          confirmed: true,
        }),
        /Forbidden/,
      );
      uid = "content";
      await assert.rejects(data.getAdminList("verification"), /Forbidden/);
      uid = "super";
    },
  );
  await check("last Super Admin cannot be disabled", async () => {
    await assert.rejects(
      mutate("roles", "super", "assign", { role: "Analyst", enabled: true }),
      /At least one/,
    );
  });
  await check(
    "ledger adjustments are atomic, audited, replay-safe, and reversible",
    async () => {
      const op = crypto.randomUUID();
      await mutate(
        "skill-ledger",
        "new",
        "adjust",
        { memberId: "a", amount: 5, confirmed: true },
        "finance",
        "Correct imported hours",
        op,
      );
      await mutate(
        "skill-ledger",
        "new",
        "adjust",
        { memberId: "a", amount: 5, confirmed: true },
        "finance",
        "Correct imported hours",
        op,
      );
      assert.equal(
        (await sql.query("select skill_hours from users where id='a'"))[0]
          .skill_hours,
        15,
      );
      await assert.rejects(
        mutate(
          "skill-ledger",
          "new",
          "adjust",
          { memberId: "a", amount: 6, confirmed: true },
          "finance",
          "Correct imported hours",
          op,
        ),
        /reused/,
      );
      await assert.rejects(
        mutate(
          "skill-ledger",
          "new",
          "adjust",
          { memberId: "a", amount: -100, confirmed: true },
          "finance",
        ),
        /negative/,
      );
      await mutate(
        "skill-ledger",
        "ops-ledger-" + op,
        "reverse",
        { confirmed: true },
        "finance",
      );
      assert.equal(
        (await sql.query("select skill_hours from users where id='a'"))[0]
          .skill_hours,
        10,
      );
      await assert.rejects(
        mutate(
          "skill-ledger",
          "ops-ledger-" + op,
          "reverse",
          { confirmed: true },
          "finance",
        ),
        /already reversed/,
      );
    },
  );
  await check(
    "verification decisions update member status and immutable audit",
    async () => {
      await sql.query(
        "insert into verification_requests(id,user_id,verification_type,statement)values('v1','a','identity','Private identity statement')",
      );
      await mutate("verification", "v1", "approve", {}, "ops");
      assert.equal(
        (await sql.query("select is_verified from users where id='a'"))[0]
          .is_verified,
        true,
      );
      await data.getAdminDetail("verification", "v1");
      await assert.rejects(
        sql.query("update admin_audit_events set reason='tampered'"),
        /append-only/,
      );
      await assert.rejects(
        sql.query("delete from admin_audit_events"),
        /append-only/,
      );
    },
  );
  await check(
    "private case notes do not appear in read-only history or audit reasons",
    async () => {
      await mutate(
        "verification",
        "v1",
        "note",
        {},
        "ops",
        "Sensitive internal investigation",
      );
      uid = "support";
      assert.equal(
        (await data.getAdminHistory("verification", "v1")).some((e) =>
          e.message.includes("Sensitive"),
        ),
        false,
      );
      const audits = await sql.query(
        "select reason from admin_audit_events where event_type='ops_verification_note'",
      );
      assert.equal(audits[0].reason, "Private case entry recorded");
      uid = "super";
    },
  );
  await check(
    "content optimistic versions, area boundaries, safe audit snapshots",
    async () => {
      const doc = {
        kind: "post",
        title: "Real article",
        slug: "real-article",
        status: "draft",
        content: "Confidential draft",
        tags: [],
      };
      await mutate("blog", "post1", "save", doc, "content");
      await data.getAdminDetail("blog", "post1");
      await assert.rejects(
        mutate("blog", "post1", "save", { ...doc, version: 999 }, "content"),
        /Reload/,
      );
      await assert.rejects(
        mutate(
          "cms",
          "post1",
          "save",
          { ...doc, kind: "page", version: 1 },
          "content",
        ),
        /another administrative/,
      );
      assert.equal(
        (
          await sql.query(
            "select after_state ? 'content' as leaked from admin_audit_events where resource_id='post1'",
          )
        )[0].leaked,
        false,
      );
    },
  );
  await check(
    "marketplace review policy prevents public visibility until approved",
    async () => {
      await mutate("settings", "marketplace", "save", {
        approvalRequired: true,
        expirationDays: 30,
        applicationLimit: 1,
        featuredEnabled: true,
      });
      await sql.query(
        "insert into marketplace_requests(id,requester_id,title,status,created_at,payload)values('r1','a','Design','open',now(),'{}')",
      );
      assert.equal(
        (
          await sql.query(
            "select status from marketplace_requests where id='r1'",
          )
        )[0].status,
        "pending_review",
      );
      await assert.rejects(
        sql.query(
          "insert into marketplace_applications(id,request_id,applicant_id,status,payload)values('app1','r1','b','pending','{}')",
        ),
        /unavailable/,
      );
      await mutate("marketplace", "r1", "approve", {}, "ops");
      await sql.query(
        "insert into marketplace_applications(id,request_id,applicant_id,status,payload)values('app1','r1','b','pending','{}')",
      );
      await data.getAdminDetail("marketplace", "r1");
    },
  );
  await db.exec(
    "insert into exchanges(id,requester_id,provider_id,title,status,skill_hours,requester_escrow_hours,provider_escrow_hours,created_at,payload)values('ex1','a','b','Exchange','in_progress',5,5,3,now(),'{}');insert into escrows(id,exchange_id,status,participants,created_at,updated_at,payload)values('es1','ex1','locked','{\"a\":{\"userId\":\"a\",\"skillHoursReserved\":5,\"securityDepositAmount\":0},\"b\":{\"userId\":\"b\",\"skillHoursReserved\":3,\"securityDepositAmount\":0}}',now(),now(),'{}');",
  );
  await check(
    "exchange holds block member transitions and admin refund conserves Hours",
    async () => {
      await mutate("exchanges", "ex1", "freeze", {}, "ops");
      await assert.rejects(
        sql.query("update exchanges set status='in_review'where id='ex1'"),
        /administrative hold/,
      );
      await data.getAdminDetail("exchanges", "ex1");
      await data.getAdminDetail("escrow", "es1");
      await mutate("escrow", "es1", "refund", { confirmed: true }, "finance");
      assert.equal(
        (
          await sql.query(
            "select sum(skill_hours)::int as total from users where id in('a','b')",
          )
        )[0].total,
        25,
      );
      await assert.rejects(
        mutate("escrow", "es1", "refund", { confirmed: true }, "finance"),
        /settled/,
      );
    },
  );
  await check(
    "support triage enforces assignee permissions; all populated readers remain valid",
    async () => {
      await sql.query(
        "insert into support_tickets(id,user_id,subject,category)values('t1','a','Need help','account')",
      );
      await mutate(
        "support",
        "t1",
        "reply",
        {},
        "support",
        "We can help with your request.",
      );
      await assert.rejects(
        mutate(
          "support",
          "t1",
          "triage",
          { status: "assigned", priority: "high", assignedTo: "analyst" },
          "support",
        ),
        /permissions/,
      );
      await data.getAdminDetail("support", "t1");
      for (const area of types.ADMIN_AREAS.filter(
        (a) => !["analytics", "settings"].includes(a),
      ))
        await data.getAdminList(area);
    },
  );
  await check(
    "canonical contract policies preserve approval fingerprints and member completion",
    async () => {
      await mutate("settings", "exchanges", "save", {
        minHours: 1,
        maxHours: 10000,
        maxDurationDays: 365,
        revisionLimit: 3,
        oneWayEnabled: true,
        mutualEnabled: true,
      });
      await sql.query(
        "update marketplace_requests set deliverables='[\"Finished design\"]'where id='r1'",
      );
      await sql.query(
        "update marketplace_applications set estimated_hours=5,estimated_completion_at=now()+interval '10 days'where id='app1'",
      );
      await sql.query(
        "select create_exchange_from_application('a','app1','canonical','canonical-escrow','rl-create','pl-create','activity-create','notify-create',now())",
      );
      const [c] = await sql.query(
        "select terms,contract_fingerprint from exchange_contracts where exchange_id='canonical'",
      );
      assert.equal(c.terms.revisionsIncluded, 3);
      assert.equal(
        (
          await sql.query(
            "select contract_fingerprint from exchange_contract_approvals where exchange_id='canonical'",
          )
        )[0].contract_fingerprint,
        c.contract_fingerprint,
      );
      await sql.query(
        "select approve_exchange_contract('b','canonical','canonical-escrow','rl-reserve','pl-reserve','activity-approve','notify-a','notify-b',now())",
      );
      assert.equal(
        (
          await sql.query("select status from exchanges where id='canonical'")
        )[0].status,
        "in_progress",
      );
      await sql.query(
        "select submit_exchange_delivery('b','canonical','delivery-c','activity-delivery','notify-delivery','[{\"name\":\"design.png\",\"url\":\"/api/storage/private/exchanges/canonical/b/design.png\"}]','Delivered design',now())",
      );
      await sql.query(
        "select record_exchange_review_decision('a','canonical','decision-c','accept',null,'activity-review','ledger-provider','ledger-requester','notification-provider','notification-requester',now())",
      );
      assert.equal(
        (
          await sql.query("select status from exchanges where id='canonical'")
        )[0].status,
        "completed",
      );
      assert.equal(
        (
          await sql.query(
            "select sum(skill_hours)::int as total from users where id in('a','b')",
          )
        )[0].total,
        25,
      );
    },
  );
  await check(
    "public publishing excludes drafts and future schedules",
    async () => {
      const cms = await load("lib/public-cms.ts", {
        "server-only": {},
        "./neon": neon,
      });
      assert.equal(await cms.publicDocument("post", "real-article"), null);
      await mutate(
        "blog",
        "post1",
        "save",
        {
          kind: "post",
          title: "Real article",
          slug: "real-article",
          status: "published",
          content: "Published content",
          tags: [],
          version: 1,
        },
        "content",
      );
      assert.equal(
        (await cms.publicDocument("post", "real-article")).content,
        "Published content",
      );
      await mutate(
        "blog",
        "future",
        "save",
        {
          kind: "post",
          title: "Future",
          slug: "future",
          status: "scheduled",
          publishAt: new Date(Date.now() + 86400000).toISOString(),
          content: "Scheduled",
          tags: [],
        },
        "content",
      );
      assert.equal(await cms.publicDocument("post", "future"), null);
      assert.equal((await cms.publicBlog()).total, 1);
    },
  );
  await check(
    "member cases reject cross-account replies and record owned replies",
    async () => {
      const member = await load("app/actions/member-operations.ts", {
        "./user": { requireAuth: async () => ({ uid }) },
        "@/lib/neon": neon,
        "@/lib/neon-storage": {
          storeUpload: async () => {
            throw new Error("Unexpected upload");
          },
        },
        "next/cache": { revalidatePath() {} },
      });
      uid = "b";
      assert.equal(
        (await member.replyToMemberCase("support", "t1", "Unowned reply"))
          .success,
        false,
      );
      uid = "a";
      assert.equal(
        (
          await member.replyToMemberCase(
            "support",
            "t1",
            "Thanks for your reply",
          )
        ).success,
        true,
      );
      const inbox = await member.getMemberCaseInbox("support");
      assert.ok(
        inbox[0].events.some((e) => e.message === "Thanks for your reply"),
      );
      uid = "super";
    },
  );
  await check(
    "billing claims prevent over-refunds and uncertain provider retries",
    async () => {
      await sql.query(
        "insert into billing_events(id,user_id,provider,event_type,description,amount,currency)values('payment-a','a','paystack','payment','Paid membership',1000,'USD')",
      );
      const first = crypto.randomUUID();
      await sql.query(
        "select admin_ops_claim_billing('finance',$1,'a','refund','Refund confirmed payment',700,'payment-a','{}')",
        [first],
      );
      await assert.rejects(
        sql.query(
          "select admin_ops_claim_billing('finance',$1,'a','refund','Second refund',700,'payment-a','{}')",
          [crypto.randomUUID()],
        ),
        /reconciliation/,
      );
      await sql.query(
        "update admin_billing_operations set state='submitted'where id=$1",
        [first],
      );
      await assert.rejects(
        sql.query(
          "select admin_ops_claim_billing('finance',$1,'a','refund','Excess refund',400,'payment-a','{}')",
          [crypto.randomUUID()],
        ),
        /exceeds/,
      );
    },
  );
  await check(
    "maintenance publishes, expires and escalates with atomic audit entries",
    async () => {
      const maintenance = await load("lib/admin-maintenance.ts", {
        "server-only": {},
        "./neon": neon,
        "./billing": {
          paystack: async () => ({
            id: 123,
            amount: 700,
            currency: "USD",
            status: "processed",
          }),
        },
      });
      await db.exec(
        "update cms_documents set publish_at=now()-interval '1 hour'where slug='future';update verification_requests set expires_at=now()-interval '1 hour'where status='approved';update support_tickets set updated_at=now()-interval '8 days'where id='t1';update admin_billing_operations set provider_id='123'where operation_type='refund';",
      );
      const result = await maintenance.runAdminMaintenance();
      assert.equal(result.published, 1);
      assert.ok(result.expired >= 1);
      assert.equal(result.escalated, 1);
      assert.equal(result.reconciled, 1);
      const events = await sql.query(
        "select event_type from admin_audit_events where request_context->>'actorType'='maintenance_job'",
      );
      for (const type of [
        "ops_blog_scheduled_publish",
        "ops_verification_expired",
        "ops_support_auto_escalated",
        "ops_subscriptions_refund_confirmed",
      ])
        assert.ok(
          events.some((e) => e.event_type === type),
          type,
        );
      const again = await maintenance.runAdminMaintenance();
      assert.equal(
        again.published + again.expired + again.escalated + again.reconciled,
        0,
      );
    },
  );
  await check(
    "provider reconciliation and plan configuration commit audit and result together",
    async () => {
      const billing = await load("app/actions/admin/billing-operations.ts", {
        "@/lib/neon": neon,
        "@/lib/admin-ops-access": access,
        "next/cache": { revalidatePath() {} },
        "@/lib/billing": {
          paystack: async (path) =>
            path.startsWith("/refund/")
              ? {
                  id: 321,
                  status: "processed",
                  amount: 300,
                  currency: "USD",
                  transaction: { id: 900 },
                }
              : path.startsWith("/plan/")
                ? {
                    plan_code: "PLN_test",
                    amount: 1000,
                    currency: "USD",
                    interval: "monthly",
                  }
                : { id: 900, currency: "USD" },
          refreshSubscription: async () => ({ subscription_status: "active" }),
        },
      });
      const operation = crypto.randomUUID();
      await sql.query(
        "select admin_ops_claim_billing('finance',$1,'a','refund','Remaining refund',300,'payment-a','{}')",
        [operation],
      );
      uid = "finance";
      assert.equal(
        (
          await billing.reconcileBillingOperation({
            id: operation,
            reason: "Confirmed in provider",
            providerId: "321",
          })
        ).success,
        true,
      );
      assert.equal(
        (
          await sql.query(
            "select state from admin_billing_operations where id=$1",
            [operation],
          )
        )[0].state,
        "completed",
      );
      assert.equal(
        (
          await billing.reconcileBillingOperation({
            id: operation,
            reason: "Duplicate attempt",
          })
        ).success,
        false,
      );
      uid = "super";
      const plan = await billing.saveAdminPlan({
        id: "verified",
        name: "Verified",
        planCode: "PLN_test",
        features: ["Verified badge"],
        enabled: true,
        reason: "Confirm provider plan",
      });
      assert.equal(plan.success, true, plan.error);
      const [saved] = await sql.query(
        "select amount,currency,billing_interval from platform_plans where id='verified'",
      );
      assert.deepEqual(saved, {
        amount: 1000,
        currency: "USD",
        billing_interval: "monthly",
      });
      const [audit] = await sql.query(
        "select count(*)::integer as count from admin_audit_events where event_type in('ops_subscriptions_provider_reconciliation','ops_plans_save')",
      );
      assert.equal(audit.count, 2);
    },
  );
  await check(
    "repeated report moderation preserves the original marketplace visibility",
    async () => {
      await sql.query(
        "insert into marketplace_requests(id,requester_id,title,description,status,created_at,payload)values('moderation-request','a','Moderation fixture','Public request','open',now(),'{}')",
      );
      await mutate("marketplace", "moderation-request", "approve", {}, "ops");
      await mutate("marketplace", "moderation-request", "hide", {}, "ops");
      await sql.query(
        "insert into platform_reports(id,reporter_id,resource_type,resource_id,reported_user_id,category,description)values('rp1','b','marketplace','moderation-request','a','spam','Repeated spam report')",
      );
      await mutate("reports", "rp1", "hide", {}, "ops");
      await mutate("marketplace", "moderation-request", "restore", {}, "ops");
      assert.equal(
        (
          await sql.query(
            "select status from marketplace_requests where id='moderation-request'",
          )
        )[0].status,
        "open",
      );
    },
  );
  console.log(
    `Verified ${checks} admin operations checks in an isolated database; no external services called.`,
  );
} catch (e) {
  console.error("FAIL", e.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
