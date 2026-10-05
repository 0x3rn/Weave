"use client";
import { useState } from "react";
import {
  disconnectIntegration,
  savePortfolioConnection,
} from "@/app/actions/settings";
import { useRouter, useSearchParams } from "next/navigation";
export function IntegrationsClient({
  connections,
  configured,
}: {
  connections: {
    provider: string;
    account_name: string;
    profile_url: string | null;
    permissions: string[];
  }[];
  configured: string[];
}) {
  const router = useRouter(),
    params = useSearchParams(),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [links, setLinks] = useState<Record<string, string>>({});
  const providers = [
    "github",
    "dribbble",
    "behance",
    "linkedin",
    "google",
    "notion",
    "gitlab",
  ];
  const run = async (
    provider: string,
    work: () => Promise<{ success: boolean; error?: string }>,
  ) => {
    setBusy(provider);
    setError("");
    try {
      const result = await work();
      if (!result.success) throw new Error(result.error);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connection failed");
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="space-y-6">
      {(error || params.get("error")) && (
        <p role="alert" className="text-sm text-error">
          {error || params.get("error")}
        </p>
      )}
      {params.get("connected") && (
        <p role="status" className="text-sm text-success">
          Account connected.
        </p>
      )}
      <p className="text-sm text-muted">
        Connect account identities and portfolio links. Weave keeps the account
        name and permissions used during authorization; it does not retain
        access tokens or sync files. Disconnect removes the Weave connection.
        You can also revoke Weave’s grant in the provider’s account settings.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {providers.map((provider) => {
          const connection = connections.find(
              (item) => item.provider === provider,
            ),
            portfolio = ["dribbble", "behance"].includes(provider),
            enabled = portfolio || configured.includes(provider);
          return (
            <section
              key={provider}
              className="space-y-3 rounded-xl border border-border p-5"
            >
              <h3 className="font-bold capitalize text-heading">
                {provider === "github"
                  ? "GitHub"
                  : provider === "gitlab"
                    ? "GitLab"
                    : provider === "linkedin"
                      ? "LinkedIn"
                      : provider}
              </h3>
              <p className="text-sm text-muted">
                {connection
                  ? `${portfolio ? "Linked portfolio" : "Connected"}: ${connection.account_name}`
                  : enabled
                    ? "Not connected"
                    : "Provider setup required"}
              </p>
              {connection && (
                <p className="text-xs text-muted">
                  Permissions:{" "}
                  {connection.permissions.join(", ") || "Profile identity"}
                </p>
              )}
              {portfolio && (
                <label className="block text-xs">
                  Portfolio URL
                  <input
                    type="url"
                    placeholder={`https://${provider === "behance" ? "behance.net" : "dribbble.com"}/your-name`}
                    value={links[provider] ?? connection?.profile_url ?? ""}
                    onChange={(event) =>
                      setLinks((previous) => ({
                        ...previous,
                        [provider]: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                  />
                </label>
              )}
              <div className="flex flex-wrap gap-3">
                {portfolio ? (
                  <button
                    disabled={!!busy}
                    onClick={() =>
                      void run(provider, () =>
                        savePortfolioConnection(
                          provider,
                          links[provider] ?? connection?.profile_url ?? "",
                        ),
                      )
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm font-bold"
                  >
                    {busy === provider
                      ? "Saving…"
                      : connection
                        ? "Update link"
                        : "Link portfolio"}
                  </button>
                ) : enabled ? (
                  <a
                    href={`/api/settings/integrations/${provider}`}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-bold"
                  >
                    {connection ? "Reconnect" : "Connect"}
                  </a>
                ) : (
                  <button
                    disabled
                    className="rounded-lg border border-border px-3 py-2 text-sm opacity-50"
                  >
                    Connect
                  </button>
                )}
                {connection && (
                  <button
                    disabled={!!busy}
                    onClick={() =>
                      void run(provider, () => disconnectIntegration(provider))
                    }
                    className="text-sm font-bold text-error"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <section className="rounded-xl border border-border bg-surface-secondary p-5">
        <h3 className="font-bold text-heading">Future integrations</h3>
        <p className="mt-2 text-sm text-muted">
          Slack, Figma, personal API tokens, and apps with ongoing access are
          planned for future releases.
        </p>
      </section>
    </div>
  );
}
