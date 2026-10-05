import { Suspense } from "react";
import { requireAuth } from "@/app/actions/user";
import { sql } from "@/lib/neon";
import { OAUTH_PROVIDERS, integrationConfigured } from "@/lib/integrations";
import { IntegrationsClient } from "@/components/settings/integrations-client";
export const metadata = { title: "Integrations - Weave" };
export default async function Page() {
  const { uid } = await requireAuth();
  const rows = await sql.query(
    "select provider,account_name,profile_url,permissions from user_integrations where user_id=$1",
    [uid],
  );
  const connections = rows.map((row) => ({
    provider: String(row.provider),
    account_name: String(row.account_name),
    profile_url: row.profile_url ? String(row.profile_url) : null,
    permissions: Array.isArray(row.permissions)
      ? row.permissions.map(String)
      : [],
  }));
  return (
    <div className="p-4 sm:p-8">
      <h2 className="mb-2 text-2xl font-bold text-heading">Integrations</h2>
      <p className="mb-6 text-muted">
        Manage connected identities and portfolio accounts.
      </p>
      <Suspense fallback={<p>Loading connections…</p>}>
        <IntegrationsClient
          connections={connections}
          configured={Object.keys(OAUTH_PROVIDERS).filter(
            integrationConfigured,
          )}
        />
      </Suspense>
    </div>
  );
}
