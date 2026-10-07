# Admin operations setup

The remaining admin sections use `database/migrations/0014_admin_operations.sql`. Overview, Invites, and Users retain their existing page and workflow implementations. Their shared authorization and navigation now participate in the staff permission system.

## Apply the database migration

First test on an isolated Neon branch with migrations 0001–0013 already applied. Set that branch's `DATABASE_URL` in the environment used for the command. Keep credentials out of Git and command output.

```powershell
npm run test:admin-operations
npm run db:apply-admin-operations
```

The second command loads `.env.local` and applies **only migration 0014** in a transaction. Verify that its `DATABASE_URL` points to the intended branch before running it. After reviewing the branch, apply the same command against production during the deployment window. Deploy the code and migration together: the shared admin guard requires the new role functions and settings tables. The migration is safe to rerun and does not reset configured settings or role assignments.

Alternative: paste the complete SQL file into the Neon SQL Editor for the intended branch and execute it in a transaction. Do not run individual financial functions manually against production.

This implementation does not automatically apply migration 0014 to your live database.

## Credentials and services

No new secret names are required. Use the existing server-only `DATABASE_URL`, Firebase Admin credentials, `NEON_STORAGE_*` bucket credentials, `PAYSTACK_SECRET_KEY`, `PAYSTACK_VERIFIED_PLAN_CODE`, email credentials, `CRON_SECRET`, and `NEXT_PUBLIC_APP_URL`. Public Firebase configuration remains separate from server credentials. Private identity/support documents use the existing private bucket; CMS images use public portfolio storage.

Configure the recurring maintenance request to `/api/jobs/settings` with `Authorization: Bearer <CRON_SECRET>`. Keep the secret at least 32 characters long. Maintenance publishes scheduled content, expires verification, escalates unattended cases, flags reported requests, reconciles provider-confirmed refunds, handles configured eligible releases, and runs the existing notification/deletion jobs. Errors remain retryable and produce an unsuccessful job response.

## Staff permissions

Active legacy administrators start with Super Admin access. Explicit staff assignments take precedence over the legacy account role. Configure staff in **Admin → Settings → Roles**. Disabling an assignment removes admin access; it does not suspend the member account. The final active Super Admin cannot be removed.

| Role             | Access                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Super Admin      | All operations, existing Overview/Invites/Users workflows, configuration, and staff assignments                 |
| Operations Admin | Verification, marketplace moderation, exchange investigations, escrow settlement, disputes, reports, and audits |
| Support Admin    | Support and reports; member, verification, exchange, dispute, and audit context with restricted writes          |
| Finance Admin    | Subscription provider controls, escrow settlement, ledger corrections, analytics, and audits                    |
| Content Admin    | CMS, Blog, and announcements                                                                                    |
| Analyst          | Read-only analytics and operational reporting, including audits; no private message or identity-document access |

Each server action checks its permission. Hiding navigation items is supplementary. The original three tabs remain restricted to Super Admin. Staff assigned from ordinary member accounts can open their permitted `/admin/<section>` routes directly.

Administrator sessions expire at the configured maximum age. Before enabling mandatory MFA, enroll staff in Firebase Authentication MFA and sign in with a second factor. The setting refuses activation from a session without MFA.

## Operational behavior

- Verification intake is `/verification`. Members submit private documents, inspect decisions, and resubmit requested information or updated documents. Approvals have a configured validity period and required verification types. Account context, reviewer decisions, and events appear in the admin queue.
- Marketplace review, visibility, featured state, and flags are recorded separately from member activity. New request/application/exchange policies run in the database. Expiration is capped at the configured request duration. Contract revisions and review/dispute periods are snapshotted before the contract fingerprint is calculated.
- Exchange and escrow holds prevent member status transitions, submissions, reviews, and settlement. Extensions retain the original agreed contract and record the administrative exception. Internal notes are separate from member-visible events.
- Skill Hour adjustments append transactions and update balances atomically. Negative balances are rejected. Only standalone manual corrections can be reversed through the ledger controls; exchange-related transactions require escrow or dispute settlement. Settlements are bounded by actual reserves, lock both participant accounts, conserve reserved Hours, and reject duplicate operations.
- Disputes support assignment, priority, investigation history, and awards from actual reserves. Unawarded Hours return to their original owner. Reports support dismissal, warnings, content moderation, restrictions, escalation, and funded-exchange dispute creation.
- Message inspection is off by default. Enable the investigation policy only when platform policy permits it. Authorized staff must provide an access reason; inspections and downloads create audit events. Direct legacy admin flags no longer bypass private-file authorization.
- Support intake is `/support/contact`. Members see their own conversation and attachments. Staff replies are member-visible; internal notes require write permission and never appear in member inboxes. Report submission is `/report/<resource-id>?type=member|marketplace|exchange|review|content`; existing message reports feed the same admin queue.
- Every manual sensitive action needs a reason. Financial actions additionally require confirmation. Operation receipts make retries safe. Audit entries preserve before/after operational state and exclude raw documents, private message bodies, draft content, payment authorization data, and internal note text. Identity/support content is anonymized during account deletion; required historical audit/ledger records remain.

## Publishing

CMS supports pages, FAQ, navigation, and reusable global content. Blog supports authors, categories, tags, Markdown editing with formatting controls, image uploads, drafts, private saved previews, SEO metadata, publication, scheduling, and archival. Raw HTML is not executed in Markdown.

- Blog posts appear at `/blog/<slug>`; the index supports search, categories, and pagination.
- General pages appear at `/pages/<slug>`. Slugs such as `about`, `contact`, or `legal/terms` also override the corresponding existing public page when published.
- Use placement `homepage`, `header`, `footer`, or `announcement` for reusable content/navigation. Existing site navigation remains available alongside managed links.
- Published FAQs appear at `/help/faq`.
- Platform CMS settings control the site announcement and additional contact, social, and legal links.
- Views count browser visits once per document/visitor/day; anonymous view identifiers are retained for 31 days. Draft previews do not increase public view counts.

Scheduled content is visible only after its publication timestamp. Maintenance persists the published status and history. A concurrent editor must reload after a version conflict.

## Billing and financial limits

Verified plan prices and currencies come from Paystack, not a hard-coded `$10` display. Configure a verified provider plan in **Settings → Plans** or use the existing environment plan code. The configured plan affects future checkouts; existing subscriptions retain their provider agreement. Monthly recurring revenue includes known recurring billing intervals and keeps currencies separate.

Subscription synchronization, cancellation, reactivation, and refunds use verified provider APIs. A persistent intent is saved before any mutation. Refunds must reference a recorded payment belonging to that member, stay inside the configured refund window, and not exceed the remaining refundable payment. Submitted refunds become financial history only when the provider confirms processing. Uncertain operations block another mutation until reconciled. Use the record's **Provider operation history → Reconcile**; if the response was lost, supply the refund ID from the Paystack dashboard. Reconciliation verifies transaction, amount, and currency and never sends another refund.

Payment receipts download from recorded billing history. They do not fabricate tax fields or unrecorded revenue.

Current Weave contracts reserve **Skill Hours** and do not fund cash security deposits or charge cash escrow fees. These cash controls remain disabled. If a legacy escrow records received cash deposits, Skill Hour settlement is blocked rather than pretending to refund cash. A funded escrow payment adapter is required before enabling those features. Provider-issued refunds and subscription controls require configured credentials and are tested with mocks, not live charges/refunds.

## Verification

```powershell
npm run test:admin-operations
npm run test:admin
npm run test:settings
npm run test:notifications
npx tsc --noEmit
npm run lint
npm run build
```

The four regression suites use isolated PGlite databases and mocked external services. Existing `test:exchange-workflow`, `test:messaging-system`, and `test:collaboration-workspace` scripts use `DATABASE_URL` and write fixtures; run those only against an explicitly selected test branch. The new operations suite also exercises the canonical member contract/approval/delivery/completion workflow.

The implementation was also checked in Edge with the actual admin client components and mocked server actions. Browser checks covered required reasons, failed-save retries, duplicate submissions, settlement previews and confirmation, support replies, draft publishing, platform settings, permission-based navigation, keyboard dialogs, and the mobile navigation drawer. The production webpack build completed using dummy database credentials; no live migration, charge, refund, or deployment was performed during verification.

Exports include the displayed, permission-scoped page and protect spreadsheet cells against formula injection. Analytics distinguish period activity, current state, and cohort metrics. Unknown payment intervals, absent historical data, and unsupported cash revenue are not invented.
