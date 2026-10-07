import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";

const require = createRequire(import.meta.url);
async function load(file, mocks = {}) {
  const loaded = { exports: {} };
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
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
let checks = 0;
async function check(name, run) {
  await run();
  checks++;
  console.log("PASS", name);
}
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  throw new Error("External services are forbidden in this isolated audit");
};
const previousOrigin = process.env.NEXT_PUBLIC_APP_URL;
process.env.NEXT_PUBLIC_APP_URL = "https://weave.test";
const db = new PGlite();
try {
  const redirect = await load("lib/internal-redirect.ts");
  await check(
    "redirects reject external origins, backslashes and URL control characters",
    async () => {
      for (const value of [
        "https://evil.test",
        "//evil.test",
        "/\\evil.test",
        "/\n/evil.test",
        "/\t/evil.test",
        "/\r/evil.test",
        "javascript:alert(1)",
        null,
      ])
        assert.equal(redirect.internalRedirect(value, "/login"), "/login");
      assert.equal(
        redirect.internalRedirect("/exchanges/123?view=files#review"),
        "/exchanges/123?view=files#review",
      );
    },
  );
  const catalog = await load("lib/notification-catalog.ts");
  const settings = await load("lib/settings.ts", {
    "./notification-catalog": catalog,
  });
  const cookieValues = new Map(),
    writes = [],
    queries = [],
    sessions = [];
  let device = null,
    stale = false,
    storageFailure = false;
  const cookies = {
    get: (name) =>
      cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
    set: (name, value, options) => {
      writes.push({ name, value, options });
      cookieValues.set(name, value);
    },
    delete: (name) => cookieValues.delete(name),
  };
  const auth = {
    verifyFirebaseIdToken: async () => ({
      uid: "a",
      auth_time: Date.now() / 1000 - (stale ? 600 : 0),
    }),
    getFirebaseSecurityState: async () => ({ factors: [], passwordVersion: 1 }),
    createFirebaseSessionCookie: async (_token, lifetime) => {
      sessions.push(lifetime);
      return "new-session";
    },
    verifyFirebaseSessionCookie: async () => ({ uid: "a", sub: "a" }),
    revokeFirebaseRefreshTokens: async () => {},
  };
  const authSql = {
    query: async (query, args) => {
      queries.push({ query, args });
      if (storageFailure) throw new Error("Database offline");
      if (query.startsWith("select coalesce(account_status"))
        return [{ status: "active", payload: {} }];
      if (query.startsWith("select id,payload from user_devices"))
        return device ? [device] : [];
      if (query.startsWith("select payload->>'sessionHash'"))
        return device ? [{ session_hash: device.payload.sessionHash }] : [];
      if (query.startsWith("with restored")) return [{ id: "a" }];
      return [];
    },
    transaction: async (factory) => Promise.all(factory(authSql)),
  };
  const mocks = {
    "@/lib/firebase-auth-server": auth,
    "@/lib/neon": { sql: authSql },
    "@/lib/settings": settings,
    "@/lib/internal-redirect": redirect,
    "@/lib/notification-email": { scheduleNotificationEmails() {} },
    "next/headers": { cookies: async () => cookies },
    "next/server": {
      NextResponse: {
        json: Response.json,
        redirect: (url) => Response.redirect(url, 307),
      },
    },
  };
  const session = await load("app/api/auth/session/route.ts", mocks);
  const logout = await load("app/api/auth/logout/route.ts", mocks);
  const request = (body, origin = "https://weave.test") =>
    new Request("https://weave.test/api/auth/session", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  await check(
    "Remember me controls cookie persistence and server token lifetime",
    async () => {
      for (const rememberMe of [false, true]) {
        writes.length = 0;
        assert.equal(
          (await session.POST(request({ idToken: "fresh", rememberMe })))
            .status,
          200,
        );
        assert.equal(sessions.at(-1), (rememberMe ? 14 : 1) * 86400000);
        assert.equal(writes.length, 2);
        for (const { options } of writes) {
          assert.equal(options.httpOnly, true);
          assert.equal(options.sameSite, "lax");
          assert.equal(options.maxAge, rememberMe ? 14 * 86400 : undefined);
        }
        const payload = JSON.parse(
          queries.findLast((q) =>
            q.query.startsWith("insert into user_devices"),
          ).args[7],
        );
        assert.equal(payload.rememberMe, rememberMe);
      }
    },
  );
  await check(
    "security refresh preserves only the persistence of the bound, owned session",
    async () => {
      for (const remembered of [false, true]) {
        cookieValues.set("session", "old-session");
        cookieValues.set("deviceId", "owned");
        device = {
          id: "owned",
          payload: {
            rememberMe: remembered,
            sessionHash: createHash("sha256")
              .update("old-session")
              .digest("hex"),
          },
        };
        await session.POST(request({ idToken: "fresh" }));
        assert.equal(sessions.at(-1), (remembered ? 14 : 1) * 86400000);
      }
      device.payload.sessionHash = "another-session";
      await session.POST(request({ idToken: "fresh" }));
      assert.equal(sessions.at(-1), 86400000);
      device = null;
      await session.POST(request({ idToken: "fresh" }));
      assert.equal(sessions.at(-1), 86400000);
    },
  );
  await check(
    "session creation rejects CSRF, stale credentials and non-boolean preferences",
    async () => {
      assert.equal(
        (await session.POST(request({ idToken: "fresh" }, "https://evil.test")))
          .status,
        403,
      );
      assert.equal(
        (await session.POST(request({ idToken: "fresh", rememberMe: "false" })))
          .status,
        400,
      );
      stale = true;
      assert.equal(
        (await session.POST(request({ idToken: "old" }))).status,
        401,
      );
      stale = false;
    },
  );
  await check(
    "both logout methods revoke the bound device and redirect safely",
    async () => {
      const seed = () => {
        cookieValues.set("session", "old-session");
        cookieValues.set("deviceId", "owned");
      };
      seed();
      const get = await logout.GET(
        new Request(
          "https://weave.test/api/auth/logout?redirect=" +
            encodeURIComponent("/\\evil.test"),
        ),
      );
      assert.equal(get.headers.get("location"), "https://weave.test/login");
      assert.equal(cookieValues.has("session"), false);
      const deletion = queries.findLast((q) =>
        q.query.startsWith("delete from user_devices"),
      );
      assert.deepEqual(deletion.args, [
        "owned",
        createHash("sha256").update("old-session").digest("hex"),
      ]);
      seed();
      assert.equal(
        (await logout.POST(request({}, "https://evil.test"))).status,
        403,
      );
      assert.equal(cookieValues.has("session"), true);
      assert.equal((await logout.POST(request({}))).status, 200);
      seed();
      storageFailure = true;
      assert.equal((await logout.POST(request({}))).status, 503);
      assert.equal(
        cookieValues.has("session"),
        true,
        "Revocation failures must remain retryable",
      );
      storageFailure = false;
      assert.equal(
        (
          await logout.GET(
            new Request("https://weave.test/api/auth/logout", {
              headers: { "sec-fetch-site": "cross-site" },
            }),
          )
        ).status,
        403,
      );
    },
  );
  const recovery = await load("app/actions/account-recovery.ts", mocks);
  await check(
    "account recovery also rejects revoked or unregistered sessions",
    async () => {
      cookieValues.set("session", "old-session");
      cookieValues.set("deviceId", "owned");
      device = null;
      assert.equal((await recovery.restoreAccount("fresh")).success, false);
      device = { id: "owned", payload: { sessionHash: "wrong-session" } };
      assert.equal((await recovery.restoreAccount("fresh")).success, false);
      device.payload.sessionHash = createHash("sha256")
        .update("old-session")
        .digest("hex");
      assert.equal((await recovery.restoreAccount("fresh")).success, true);
      cookieValues.delete("deviceId");
      assert.equal((await recovery.restoreAccount("fresh")).success, false);
    },
  );

  for (const file of (await readdir("database/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile("database/migrations/" + file, "utf8"));
  const sql = { query: async (q, args = []) => (await db.query(q, args)).rows };
  const neon = {
    sql,
    iso: (v) => (v instanceof Date ? v.toISOString() : String(v || "")),
    payload: (v) => (v && typeof v === "object" ? v : {}),
  };
  let uid = "ops";
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
  const scope = await load("lib/admin-evidence-scope.ts", {
    "server-only": {},
    "./neon": neon,
  });
  const evidence = await load("app/actions/admin/evidence.ts", {
    "@/lib/neon": neon,
    "@/lib/admin-ops-access": access,
    "@/lib/admin-evidence-scope": scope,
  });
  const data = await load("lib/admin-ops-data.ts", {
    "server-only": {},
    "./neon": neon,
    "./admin-ops-types": types,
    "./admin-ops-access": access,
  });
  const operations = await load("app/actions/admin/operations.ts", {
    "@/lib/neon": neon,
    "@/lib/admin-ops-access": access,
    "@/lib/admin-ops-data": data,
    "@/lib/admin-ops-types": types,
    "@/lib/admin-ops-settings": {},
    "next/cache": { revalidatePath() {} },
  });
  await db.exec(`insert into users(id,full_name,email,role,account_status,payload)values
    ('ops','Operations','ops@example.test','Member','active','{}'),('support','Support','support@example.test','Member','active','{}'),
    ('analyst','Analyst','analyst@example.test','Member','active','{}'),('finance','Finance','finance@example.test','Member','active','{}'),
    ('content','Content','content@example.test','Member','active','{}'),('a','Member A','a@example.test','Member','active','{}'),('b','Member B','b@example.test','Member','active','{}');
    insert into admin_staff_roles(user_id,role_name)values('ops','Operations Admin'),('support','Support Admin'),('analyst','Analyst'),('finance','Finance Admin'),('content','Content Admin');
    insert into exchanges(id,requester_id,provider_id,title,status,skill_hours,payload)values('ex','a','b','Exchange','in_progress',1,'{}');
    insert into conversations(id,conversation_type,context_id,payload)values('exchange-chat','exchange','ex','{}'),('private-chat','direct','ex','{}');
    insert into conversation_participants(conversation_id,user_id)values('exchange-chat','a'),('exchange-chat','b'),('private-chat','a'),('private-chat','b');
    insert into messages(id,conversation_id,sender_id,content,created_at,payload)values('allowed','exchange-chat','a','Exchange evidence',now(),'{}'),('secret','private-chat','b','Private unrelated DM',now(),'{}');
    insert into verification_requests(id,user_id,verification_type,statement)values('ver','a','identity','Sensitive identity statement');
    insert into ledger_entries(id,source_collection,user_id,entry_type,amount,description,notes,payload)values('ledger','admin-audit','a','Adjusted',1,'Public reason','Private internal note','{}');
    insert into billing_accounts(user_id,provider,customer_id,subscription_id,subscription_status,currency)values('a','paystack','CUS_a','SUB_a','active','NGN');
    insert into billing_events(id,user_id,provider,event_type,description,amount,currency)values('payment','a','paystack','payment','Original USD payment',1000,'USD');`);
  await check(
    "the existing Users adjustment enforces policy without breaking idempotent retries",
    async () => {
      await sql.query(
        "insert into users(id,email,role,account_status,skill_hours,payload)values('super','super@example.test','Admin','active',0,'{}')",
      );
      const operation = crypto.randomUUID();
      const adjust = (amount, id = crypto.randomUUID()) =>
        sql.query(
          "select admin_adjust_skill_hours('super','a',$1,'Reviewed adjustment',$2)as balance",
          [amount, id],
        );
      const [initial] = await adjust(2, operation);
      await sql.query(
        "update platform_settings set value=value||'{\"manualAdjustmentsEnabled\":false,\"adjustmentLimit\":1}' where section='skill-hours'",
      );
      await assert.rejects(adjust(1), /disabled/);
      assert.equal((await adjust(2, operation))[0].balance, initial.balance);
      await sql.query(
        "update platform_settings set value=value||'{\"manualAdjustmentsEnabled\":true}' where section='skill-hours'",
      );
      await assert.rejects(adjust(2), /Invalid adjustment amount/);
      assert.equal((await adjust(1))[0].balance, initial.balance + 1);
      await sql.query(
        "update platform_settings set value=value||'{\"adjustmentLimit\":10000}' where section='skill-hours'",
      );
    },
  );
  await check(
    "evidence policy, permissions and resource scope block unrelated private messages",
    async () => {
      await assert.rejects(
        evidence.inspectAdminEvidence(
          "exchanges",
          "ex",
          "Review dispute evidence",
        ),
        /disabled/,
      );
      await sql.query(
        "update platform_settings set value=value||'{\"messageInspection\":true}' where section='trust-safety'",
      );
      await assert.rejects(
        evidence.inspectAdminEvidence(
          "exchanges",
          "private-chat",
          "Review exchange evidence",
        ),
        /not found/,
      );
      const result = await evidence.inspectAdminEvidence(
        "exchanges",
        "ex",
        "Review exchange evidence",
      );
      assert.deepEqual(
        result.messages.map((m) => m.id),
        ["allowed"],
      );
      await assert.rejects(
        evidence.inspectAdminEvidence(
          "disputes",
          "ex",
          "Review dispute evidence",
        ),
        /not found/,
      );
      uid = "support";
      await assert.rejects(
        evidence.inspectAdminEvidence(
          "exchanges",
          "ex",
          "Review exchange evidence",
        ),
        /Forbidden/,
      );
      const [audit] = await sql.query(
        "select count(*)::int as n from admin_audit_events where event_type='ops_exchanges_evidence_access'",
      );
      assert.equal(audit.n, 1);
    },
  );
  await check(
    "document downloads enforce resource scope and record access before reading storage",
    async () => {
      await sql.query(
        "insert into exchange_deliveries(id,exchange_id,submitted_by,files,payload)values('delivery','ex','a',$1::jsonb,'{}')",
        [
          JSON.stringify([
            {
              name: "Evidence.pdf",
              url: "/api/storage/private/exchanges/ex/a/evidence.pdf",
            },
          ]),
        ],
      );
      let storageReads = 0;
      const downloads = await load("app/api/admin/evidence/route.ts", {
        "@/lib/neon": neon,
        "@/lib/admin-ops-access": access,
        "@/lib/admin-evidence-scope": scope,
        "@/lib/neon-storage": {
          privateBucket: () => "test-bucket",
          neonStorage: () => ({
            send: async () => {
              storageReads++;
              const [audit] = await sql.query(
                "select count(*)::int as n from admin_audit_events where event_type='ops_exchanges_document_download'",
              );
              assert.equal(audit.n, 1);
              return {
                Body: {
                  transformToWebStream: () =>
                    new ReadableStream({
                      start(controller) {
                        controller.enqueue(new Uint8Array([1, 2, 3]));
                        controller.close();
                      },
                    }),
                },
              };
            },
          }),
        },
      });
      const downloadRequest = (area, id) =>
        new Request(
          `https://weave.test/api/admin/evidence?area=${area}&id=${id}&delivery=delivery&index=0&reason=Review+case+evidence`,
        );
      uid = "ops";
      assert.equal(
        (await downloads.GET(downloadRequest("exchanges", "private-chat")))
          .status,
        403,
      );
      assert.equal(
        (await downloads.GET(downloadRequest("disputes", "ex"))).status,
        403,
      );
      assert.equal(storageReads, 0);
      uid = "support";
      assert.equal(
        (await downloads.GET(downloadRequest("exchanges", "ex"))).status,
        403,
      );
      assert.equal(storageReads, 0);
      uid = "ops";
      const response = await downloads.GET(downloadRequest("exchanges", "ex"));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal((await response.arrayBuffer()).byteLength, 3);
      assert.equal(storageReads, 1);
    },
  );
  await check(
    "private statements and internal ledger notes are hidden from read-only roles",
    async () => {
      uid = "support";
      assert.ok(
        !JSON.stringify(
          await data.getAdminDetail("verification", "ver"),
        ).includes("Sensitive identity statement"),
      );
      uid = "ops";
      assert.ok(
        JSON.stringify(
          await data.getAdminDetail("verification", "ver"),
        ).includes("Sensitive identity statement"),
      );
      uid = "analyst";
      assert.ok(
        !JSON.stringify(
          await data.getAdminDetail("skill-ledger", "ledger"),
        ).includes("Private internal note"),
      );
      uid = "finance";
      assert.ok(
        JSON.stringify(
          await data.getAdminDetail("skill-ledger", "ledger"),
        ).includes("Private internal note"),
      );
    },
  );
  await check(
    "content and assignment lookups exclude unrelated members and private emails",
    async () => {
      uid = "content";
      let result = await operations.adminLookups("blog.write");
      assert.ok(!result.members.some((m) => m.id === "a"));
      assert.ok(result.members.every((m) => m.email === ""));
      uid = "support";
      result = await operations.adminLookups("support.write");
      assert.ok(result.members.every((m) => m.role && m.email === ""));
      await assert.rejects(
        operations.adminLookups("roles.manage"),
        /Forbidden/,
      );
    },
  );
  let providerCalls = 0,
    updatedStatus = "active";
  const billing = await load("app/actions/admin/billing-operations.ts", {
    "@/lib/neon": neon,
    "@/lib/admin-ops-access": access,
    "next/cache": { revalidatePath() {} },
    "@/lib/billing": {
      paystack: async (path) => {
        providerCalls++;
        if (path.startsWith("/transaction/verify/"))
          return {
            id: 123,
            status: "success",
            amount: 1000,
            currency: "USD",
            customer: { customer_code: "CUS_a" },
          };
        if (path === "/refund") return { id: 789 };
        return {
          customer: { customer_code: "CUS_a" },
          email_token: "test-token",
          plan: { interval: "monthly" },
        };
      },
      refreshSubscription: async () => ({
        subscription_status: updatedStatus,
        amount: 1000,
        currency: "USD",
      }),
    },
  });
  uid = "finance";
  const billingInput = (action, extra = {}) => ({
    userId: "a",
    action,
    reason: "Reviewed provider action",
    operationId: crypto.randomUUID(),
    confirmed: true,
    amount: 0,
    transactionId: "",
    ...extra,
  });
  await check(
    "provider actions require literal confirmation and refunds use original payment currency",
    async () => {
      assert.equal(
        (
          await billing.adminBillingOperation(
            billingInput("cancel", { confirmed: "false" }),
          )
        ).success,
        false,
      );
      assert.equal(providerCalls, 0);
      assert.equal(
        (
          await billing.adminBillingOperation(
            billingInput("refund", { amount: 100, transactionId: "payment" }),
          )
        ).success,
        true,
      );
    },
  );
  await check(
    "provider changes remain submitted until the requested status is confirmed",
    async () => {
      let input = billingInput("cancel");
      assert.equal((await billing.adminBillingOperation(input)).success, true);
      assert.equal(
        (
          await sql.query(
            "select state from admin_billing_operations where id=$1",
            [input.operationId],
          )
        )[0].state,
        "submitted",
      );
      updatedStatus = "non-renewing";
      input = billingInput("cancel");
      assert.equal((await billing.adminBillingOperation(input)).success, true);
      assert.equal(
        (
          await sql.query(
            "select state from admin_billing_operations where id=$1",
            [input.operationId],
          )
        )[0].state,
        "completed",
      );
    },
  );
  console.log(
    `Verified ${checks} security regression groups; isolated database and mocked providers only.`,
  );
} catch (error) {
  console.error("FAIL", error.message);
  process.exitCode = 1;
} finally {
  await db.close();
  globalThis.fetch = originalFetch;
  if (previousOrigin === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = previousOrigin;
}
