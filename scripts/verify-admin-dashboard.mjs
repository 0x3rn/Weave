import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";
const require = createRequire(import.meta.url);
async function load(file, mocks = {}) {
  const loaded = { exports: {} };
  const output = ts.transpileModule(await readFile(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  new Function("require", "module", "exports", output)(
    (name) => (Object.hasOwn(mocks, name) ? mocks[name] : require(name)),
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const db = new PGlite();
let count = 0;
const check = (name, fn) =>
  Promise.resolve()
    .then(fn)
    .then(() => {
      count++;
      console.log("PASS", name);
    });
try {
  const migrations = (await readdir("database/migrations"))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of migrations)
    await db.exec(await readFile("database/migrations/" + file, "utf8"));
  await db.exec(
    await readFile(
      "database/migrations/0013_admin_dashboard_integrity.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile("database/migrations/0014_admin_operations.sql", "utf8"),
  );
  const sql = {
    query: async (query, args) => (await db.query(query, args)).rows,
  };
  const neon = {
    sql,
    iso: (v) =>
      v instanceof Date ? v.toISOString() : typeof v === "string" ? v : "",
    payload: (v) => (v && typeof v === "object" ? v : {}),
  };
  const users = await load("lib/users.ts", {
    "server-only": {},
    "./neon": neon,
  });
  let uid = "admin";
  const access = await load("lib/admin-ops-access.ts", {
    "server-only": {},
    "./neon": neon,
    "./admin-ops-types": await load("lib/admin-ops-types.ts"),
    "@/app/actions/user": {
      requireAuth: async () => {
        if (!uid) throw new Error("Unauthorized");
        return { uid, auth_time: Date.now() / 1000 };
      },
    },
    "next/headers": { headers: async () => new Headers() },
  });
  const guard = await load("app/actions/admin/auth.ts", {
    "@/lib/admin-ops-access": access,
  });
  const cache = { revalidatePath: () => {} };
  let mailOk = false,
    mailCalls = 0;
  const email = {
    sendEmail: async () => {
      mailCalls++;
      return mailOk ? { success: true } : { error: "Mock delivery failure" };
    },
  };
  const inviteHelper = await load("lib/admin-invites.ts", {
    "server-only": {},
    "./neon": neon,
    "./email": email,
  });
  await check(
    "applicant links allow only web URLs and DTOs exclude unexpected fields",
    async () => {
      const applicant = inviteHelper.applicationForAdmin({
        id: "url-app",
        email: "url@example.test",
        payload: {
          portfolio: "javascript:alert(1)",
          github: "https://github.com/example",
          linkedIn: "data:text/html,hello",
          isAdmin: true,
          skillsOffered: ["React", 42],
        },
      });
      assert.equal(applicant.portfolio, "");
      assert.equal(applicant.linkedIn, "");
      assert.equal(applicant.github, "https://github.com/example");
      assert.equal(applicant.isAdmin, undefined);
      assert.deepEqual(applicant.skillsOffered, ["React"]);
    },
  );
  const metrics = await load("lib/user-metrics.ts");
  const summary = await load("lib/admin-summary.ts");
  const common = {
    "@/lib/neon": neon,
    "./auth": guard,
    "next/cache": cache,
    "@/lib/admin-invites": inviteHelper,
    "@/lib/email": email,
    "@/lib/users": users,
    "@/lib/user-metrics": metrics,
    "@/lib/admin-summary": summary,
    "@/lib/notification-email": { scheduleNotificationEmails: () => {} },
  };
  const invites = await load("app/actions/admin/invites.ts", common),
    codes = await load("app/actions/admin/invite-codes.ts", common),
    admin = await load("app/actions/admin/users.ts", common);
  let created = 0,
    deleted = 0;
  const auth = await load("app/actions/auth.ts", {
    "@/lib/neon": neon,
    "@/lib/firebase-auth-server": {
      getFirebaseUserByEmail: async () => null,
      createFirebaseUser: async () => ({ uid: "signup-" + ++created }),
      deleteFirebaseUser: async () => {
        deleted++;
      },
    },
  });
  await db.query(
    "insert into users(id,email,role,account_status,skill_hours,created_at,payload) values('admin','admin@example.test','Admin','active',0,now(),'{}'),('member','member@example.test','Member','active',10,now(),'{}'),('stale','stale@example.test','Member','active',0,now(),'{\"role\":\"Admin\",\"isAdmin\":true}'),('legacy','legacy@example.test',null,'active',0,now(),'{\"isAdmin\":true}')",
  );
  await check(
    "canonical roles and anonymous/member authorization",
    async () => {
      for (const actor of [null, "member", "stale"]) {
        uid = actor;
        await assert.rejects(
          guard.requireAdminUser(),
          /Unauthorized|Forbidden/,
        );
      }
      uid = "admin";
      assert.equal(await guard.requireAdminUser(), "admin");
      uid = "legacy";
      assert.equal(await guard.requireAdminUser(), "legacy");
      uid = "admin";
    },
  );
  await check(
    "private notes excluded from member props and available to admins",
    async () => {
      assert.equal(
        (await admin.saveAdminUserNotes("member", "Private staff note"))
          .success,
        true,
      );
      assert.equal((await users.getUserById("member")).adminNotes, undefined);
      assert.equal(
        (await admin.getAdminUsersDashboard()).users.find(
          (u) => u.uid === "member",
        ).adminNotes,
        "Private staff note",
      );
      const target = (p) => p;
      const page = await load("app/(app)/settings/account/page.tsx", {
        "@/app/actions/user": { getCurrentUserId: async () => "member" },
        "@/lib/users": users,
        "next/navigation": {},
        "@/components/settings/account-client": { AccountClient: target },
      });
      const tree = await page.default();
      assert.equal(
        tree.props.children.find((n) => n?.type === target).props.user
          .adminNotes,
        undefined,
      );
      const snapshotSource = await readFile("app/actions/settings.ts", "utf8");
      assert.match(snapshotSource, /delete settings.adminNotes/);
    },
  );
  const settings = {
    startingHours: 5,
    badge: false,
    welcomeMessage: "",
    expiresInDays: 7,
  };
  await db.query(
    "insert into invite_applications(id,email,full_name,status,submitted_at,payload) values('app','app@example.test','Applicant','pending',now(),'{\"fullName\":\"Applicant\"}'),('claimed','claimed@example.test','Claimed','pending',now(),'{}')",
  );
  await check(
    "new invite submissions enter overview history once",
    async () => {
      assert.equal(
        (
          await sql.query(
            "select count(*)::int as count from admin_audit_events where event_type='invite_submitted' and resource_id='app'",
          )
        )[0].count,
        1,
      );
      await db.exec(
        await readFile(
          "database/migrations/0013_admin_dashboard_integrity.sql",
          "utf8",
        ),
      );
      assert.equal(
        (
          await sql.query(
            "select count(*)::int as count from admin_audit_events where event_type='invite_submitted' and resource_id='app'",
          )
        )[0].count,
        1,
      );
    },
  );
  let issued;
  await check(
    "approval is idempotent and reports failed mail delivery",
    async () => {
      const results = await Promise.all([
        invites.approveInvite("app", settings),
        invites.approveInvite("app", { ...settings, startingHours: 99 }),
      ]);
      assert.ok(results.every((r) => r.success && r.warning));
      assert.equal(results[0].invite.code, results[1].invite.code);
      const rows = await sql.query(
        "select * from invites where payload->>'inviteApplicationId'='app'",
      );
      assert.equal(rows.length, 1);
      assert.equal(rows[0].payload.approvedSettings.startingHours, 5);
      issued = rows[0];
    },
  );
  await check(
    "rejection revokes linked codes and prevents registration",
    async () => {
      assert.equal(
        (
          await invites.rejectInvite("app", {
            reason: "Not eligible",
            feedback: "",
          })
        ).success,
        true,
      );
      assert.equal(
        (
          await sql.query("select status from invites where id=$1", [issued.id])
        )[0].status,
        "revoked",
      );
      assert.ok(
        (
          await auth.registerWithInvite(
            issued.code,
            issued.email,
            "Password123",
          )
        ).error,
      );
      assert.equal(created, 0);
      assert.ok((await codes.extendInviteCode(issued.id, 7)).error);
      await db.query("update invites set status='pending' where id=$1", [
        issued.id,
      ]);
      assert.ok(
        (
          await auth.registerWithInvite(
            issued.code,
            issued.email,
            "Password123",
          )
        ).error,
      );
      assert.equal(created, 0);
    },
  );
  await check(
    "registration uses issued settings and claimed applications cannot be rejected",
    async () => {
      const result = await invites.approveInvite("claimed", settings);
      assert.ok(result.success);
      await db.query(
        'update invite_applications set payload=payload||\'{"approvedSettings":{"startingHours":99,"badge":true}}\' where id=\'claimed\'',
      );
      assert.ok(
        (
          await auth.registerWithInvite(
            result.invite.code,
            "claimed@example.test",
            "Password123",
          )
        ).success,
      );
      const user = (
        await sql.query(
          "select skill_hours,is_verified from users where id='signup-1'",
        )
      )[0];
      assert.equal(user.skill_hours, 5);
      assert.equal(user.is_verified, false);
      assert.ok(
        (
          await invites.rejectInvite("claimed", {
            reason: "Reject",
            feedback: "",
          })
        ).error,
      );
      assert.ok((await codes.extendInviteCode(result.invite.id, 7)).error);
    },
  );
  await check(
    "registration rolls back Firebase creation if rejection wins the race",
    async () => {
      const direct = await codes.createInviteCode("race@example.test", 7);
      const racedAuth = await load("app/actions/auth.ts", {
        "@/lib/neon": neon,
        "@/lib/firebase-auth-server": {
          getFirebaseUserByEmail: async () => null,
          createFirebaseUser: async () => {
            await codes.revokeInviteCode(direct.id);
            return { uid: "race-user" };
          },
          deleteFirebaseUser: async () => {
            deleted++;
          },
        },
      });
      assert.ok(
        (
          await racedAuth.registerWithInvite(
            direct.code,
            "race@example.test",
            "Password123",
          )
        ).error,
      );
      assert.equal(deleted, 1);
      assert.equal(
        (await sql.query("select * from users where id='race-user'")).length,
        0,
      );
    },
  );
  await check(
    "expired status, extension, revocation, and resend rules",
    async () => {
      const result = await codes.createInviteCode("expired@example.test", 7);
      assert.ok(result.success);
      await db.query(
        "update invites set expires_at=now()-interval '30 days' where id=$1",
        [result.id],
      );
      assert.equal(
        (await codes.getIssuedInvites()).invites.find((i) => i.id === result.id)
          .status,
        "expired",
      );
      assert.equal(
        (await auth.getInviteDetails(result.code)).status,
        "expired",
      );
      assert.ok((await codes.resendInviteEmail(result.id)).error);
      const extension = await codes.extendInviteCode(result.id, 7);
      assert.ok(extension.success);
      assert.ok(new Date(extension.invite.expiresAt) > new Date());
      await codes.revokeInviteCode(result.id);
      assert.ok((await codes.extendInviteCode(result.id, 7)).error);
      assert.equal(
        (
          await sql.query("select status from invites where id=$1", [result.id])
        )[0].status,
        "revoked",
      );
      const resend = await codes.createInviteCode("resend@example.test", 7);
      assert.ok((await codes.resendInviteEmail(resend.id)).error);
      mailOk = true;
      assert.ok((await codes.resendInviteEmail(resend.id)).success);
      mailOk = false;
    },
  );
  await check(
    "Skill Hour corrections are atomic, typed, and safe to retry",
    async () => {
      const op = crypto.randomUUID();
      const result = await Promise.all([
        admin.adjustUserSkillHours("member", 5, "Correction", op),
        admin.adjustUserSkillHours("member", 5, "Correction", op),
      ]);
      assert.ok(result.every((r) => r.success && r.newBalance === 15));
      assert.equal(
        (
          await sql.query(
            "select count(*)::int as count from ledger_entries where user_id='member'",
          )
        )[0].count,
        1,
      );
      assert.ok(
        (await admin.adjustUserSkillHours("member", 6, "Correction", op)).error,
      );
      assert.ok(
        (
          await admin.adjustUserSkillHours(
            "member",
            -100,
            "Debit",
            crypto.randomUUID(),
          )
        ).error,
      );
      assert.equal((await users.getUserById("member")).skillHours, 15);
      assert.ok(
        (
          await admin.adjustUserSkillHours(
            "member",
            0,
            "Zero",
            crypto.randomUUID(),
          )
        ).error,
      );
    },
  );
  await check(
    "status validation, self-protection, and lifecycle protection",
    async () => {
      assert.ok((await admin.updateUserStatus("member", "unexpected")).error);
      assert.ok((await admin.updateUserVerification("member", "true")).error);
      assert.ok((await admin.updateUserStatus("admin", "suspended")).error);
      assert.ok((await admin.deleteUserAccount("admin")).error);
      assert.ok((await admin.updateUserStatus("member", "suspended")).success);
      assert.ok((await admin.updateUserStatus("member", "active")).success);
      assert.ok((await admin.updateUserVerification("member", true)).success);
      assert.equal((await users.getUserById("member")).isVerified, true);
      assert.ok((await admin.updateUserStatus("legacy", "banned")).success);
      uid = "legacy";
      await assert.rejects(guard.requireAdminUser(), /Forbidden/);
      await assert.rejects(
        db.query(
          "select admin_update_member('legacy','admin','status','\"banned\"'::jsonb)",
        ),
        /Forbidden/,
      );
      uid = "admin";
      assert.equal((await users.getUserById("admin")).status, "active");
      assert.ok((await admin.updateUserStatus("legacy", "active")).success);
    },
  );
  await check(
    "deletion schedules existing retryable cleanup and retains ledger ownership",
    async () => {
      assert.ok((await admin.deleteUserAccount("member")).success);
      assert.equal(
        (await users.getUserById("member")).status,
        "deletion_pending",
      );
      assert.equal(deleted, 1);
      const request = (
        await sql.query(
          "select * from account_deletion_requests where user_id='member'",
        )
      )[0];
      assert.ok(
        new Date(request.delete_after) > new Date(Date.now() + 13 * 86400000),
      );
      assert.equal(
        (
          await sql.query(
            "select user_id from ledger_entries where user_id='member'",
          )
        )[0].user_id,
        "member",
      );
      assert.ok((await admin.updateUserStatus("member", "active")).error);
      await db.query(
        "insert into users(id,role,account_status,payload) values('busy-member','Member','active','{}')",
      );
      await db.query(
        "insert into exchanges(id,requester_id,provider_id,status,skill_hours,payload)values('busy-exchange','busy-member','stale','in_progress',1,'{}')",
      );
      assert.ok((await admin.deleteUserAccount("busy-member")).error);
    },
  );
  await check("all mutation actions require admin authorization", async () => {
    uid = "stale";
    await assert.rejects(admin.saveAdminUserNotes("member", "No"), /Forbidden/);
    await assert.rejects(invites.approveInvite("app", settings), /Forbidden/);
    await assert.rejects(codes.getIssuedInvites(), /Forbidden/);
    uid = "admin";
  });
  await check("date summaries, CSV escaping, and audit retention", async () => {
    const csv = await load("lib/csv.ts");
    assert.match(
      csv.toCsv([["=HYPERLINK(1)", "A, B", "Line\nTwo"]]),
      /"'=HYPERLINK\(1\)"/,
    );
    const now = new Date("2026-10-05T00:30:00Z"),
      data = [
        {
          uid: "a",
          status: "active",
          createdAt: "2026-10-04T23:30:00Z",
          lastActive: "2026-10-04T23:40:00Z",
          isVerified: false,
        },
        {
          uid: "b",
          status: "deactivated",
          createdAt: "2026-10-01",
          lastActive: now.toISOString(),
          isVerified: false,
        },
      ];
    const result = summary.summarizeAdminUsers(data, 2, "Africa/Lagos", now);
    assert.equal(result.activeTodayCount, 1);
    assert.equal(result.newTodayCount, 1);
    assert.equal(result.unverifiedCount, 1);
    const beforeRerun = await sql.query(
      "select id from admin_audit_events where event_type='invite_approved'",
    );
    await db.exec(
      await readFile(
        "database/migrations/0013_admin_dashboard_integrity.sql",
        "utf8",
      ),
    );
    assert.equal(
      (
        await sql.query(
          "select id from admin_audit_events where event_type='invite_approved'",
        )
      ).length,
      beforeRerun.length,
    );
    const logs = await sql.query("select * from admin_audit_events");
    assert.ok(logs.length > 8);
    assert.ok(
      logs.every(
        (row) => !JSON.stringify(row.metadata).includes("Private staff note"),
      ),
    );
    assert.ok(mailCalls > 0);
  });
  await check(
    "overview metrics, activity, and export routes are guarded",
    async () => {
      const page = await load("app/admin/page.tsx", {
        "@/app/actions/admin/auth": guard,
        "@/lib/users": users,
        "@/lib/neon": neon,
        "@/lib/admin-summary": summary,
        "next/link": (p) => p,
      });
      await db.query(
        "insert into marketplace_requests(id,status,expires_at,payload)values('open-request','open',now()+interval '1 day','{}'),('expired-open-request','open',now()-interval '1 day','{}'),('closed-request','closed',null,'{}')",
      );
      await db.query(
        "insert into exchanges(id,status,payload)values('completed-exchange','completed','{}'),('cancelled-exchange','cancelled','{}')",
      );
      const overview = await page.default({
        searchParams: Promise.resolve({ activity: "all" }),
      });
      const cards = overview.props.children[1].props.children;
      const metric = (label) =>
        cards.find((card) => card.props.children[0].props.children === label)
          .props.children[1].props.children;
      assert.equal(metric("Active exchanges"), "1");
      assert.equal(metric("Open marketplace requests"), "1");
      const csv = await load("lib/csv.ts"),
        route = await load("app/api/admin/export/route.ts", {
          "@/app/actions/admin/auth": guard,
          "@/lib/neon": neon,
          "@/lib/csv": csv,
        });
      const response = await route.GET();
      assert.equal(response.status, 200);
      assert.match(await response.text(), /Applicant/);
      uid = "stale";
      assert.equal((await route.GET()).status, 403);
      await assert.rejects(
        page.default({ searchParams: Promise.resolve({}) }),
        /Forbidden/,
      );
      uid = "admin";
    },
  );
  console.log(
    `Verified ${count} admin regression groups against isolated PostgreSQL. No external services called.`,
  );
} finally {
  await db.close();
}
