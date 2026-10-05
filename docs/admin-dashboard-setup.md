# Admin dashboard fixes

Overview, Invites, and Users use the existing Firebase Authentication, Neon PostgreSQL, storage, and SMTP configuration. No additional environment variables are required.

## Apply the database migration

Fill `DATABASE_URL` in `.env.local`. For an existing database with migrations 0001–0012 applied, run from the project folder:

```sh
npm run db:apply-admin
```

This applies `database/migrations/0013_admin_dashboard_integrity.sql` in a transaction. The migration can be rerun. Test it on a development database branch before production. For a fresh database, `npm run db:apply-schema` applies every migration in order. The new code depends on migration 0013; deploy the migration before the updated application.

No migration is applied to an external database by the automated regression tests. The suite uses an isolated embedded PostgreSQL database and mocks Firebase and email.

## Permissions and privacy

The `users.role` column is the source of admin permissions. A null role with the legacy boolean `payload.isAdmin=true` remains supported. A non-null Member or Moderator role overrides legacy flags and payload roles. The admin layout, actions, and database helpers agree on this rule, and require an active account. To grant or revoke access, update the canonical column through your authorized database administration process; removing only a payload flag does not revoke a canonical Admin role.

Staff notes are excluded from member-facing user objects and settings snapshots. They are explicitly loaded only by guarded admin actions. Audit history records the operation and actor without copying private note content. CSV exports omit staff notes and escape spreadsheet formulas.

## Invite decisions

Approval and code issuance are one transaction. Concurrent or repeated approval reuses the existing live code and its issued Skill Hour/badge settings. An expired or revoked code requires a new approval or eligible extension; new approval retires outstanding codes. Rejection revokes unused linked codes under the same application lock used by registration. Once an applicant registers, manage their member account instead of rejecting the claimed application.

Extensions lock and recheck code eligibility and extend from the later of now or the existing expiration. Used/revoked codes cannot be reopened. Signup links use `NEXT_PUBLIC_APP_URL`. Expired codes appear consistently in the list, filter, and signup response.

An email delivery failure does not reverse the saved decision. The UI displays a warning and invites can be resent from Issued Codes after SMTP is corrected. A failed resend reports an error. Creating a direct code gives five starting Skill Hours without a verified badge; copy its link or use Resend to deliver it.

## Member controls and deletion

Status changes validate allowed values, protect the acting administrator, and preserve at least one active administrator. Suspension or banning removes tracked sessions. Recovery/deletion lifecycle states cannot be restored through the status buttons.

Skill Hour corrections require a reason, reject negative resulting balances, and atomically record the ledger entry, notification, and audit event. A per-operation identifier makes retries safe and rejects reuse with different adjustment details.

Admin deletion schedules the existing 14-day account deletion workflow. Active exchanges, unresolved disputes, and active subscriptions must be resolved first. The authenticated `/api/jobs/settings` maintenance endpoint performs retryable storage/Firebase cleanup and then anonymizes the retained member identifier. Ledger and required audit records remain linked. See `settings-setup.md` for scheduler and recovery instructions. Admin controls never hard-delete the database member before external cleanup.

## Overview and verification

Overview displays real member, active exchange, open marketplace request, disputed escrow, and invite counts. Activity history includes known historical invite submissions/approvals and records new submissions and admin operations; it does not invent missing historical events. History uses chronological pagination, and dates use the administrator's configured time zone, falling back to UTC. Export Applications downloads an authenticated CSV.

Users shows active unverified members rather than an invented pending verification queue. Identity verification, marketplace moderation, and other unfinished admin tabs are outside this change.

## Verify locally

```sh
npm run test:admin
npm run test:settings
npm run test:notifications
npx tsc --noEmit
npm run build
```

The admin suite checks authorization and legacy roles, staff-note privacy, duplicate approvals, rejection/registration races, issued settings, expired extensions and resends, atomic/idempotent corrections, deletion retention and eligibility, date summaries, CSV safety, and protected overview/export routes. Live provider behavior additionally requires configured Firebase, SMTP, storage, and disposable test accounts.
