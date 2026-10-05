import "server-only";
import { object } from "./settings";
type Provider = {
  authorize: string;
  token: string;
  identity?: string;
  scopes: string;
  pkce?: boolean;
};
export const OAUTH_PROVIDERS: Record<string, Provider> = {
  github: {
    authorize: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    identity: "https://api.github.com/user",
    scopes: "read:user",
    pkce: true,
  },
  google: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    identity: "https://openidconnect.googleapis.com/v1/userinfo",
    scopes: "openid profile email",
    pkce: true,
  },
  linkedin: {
    authorize: "https://www.linkedin.com/oauth/v2/authorization",
    token: "https://www.linkedin.com/oauth/v2/accessToken",
    identity: "https://api.linkedin.com/v2/userinfo",
    scopes: "openid profile email",
  },
  gitlab: {
    authorize: "https://gitlab.com/oauth/authorize",
    token: "https://gitlab.com/oauth/token",
    identity: "https://gitlab.com/api/v4/user",
    scopes: "read_user",
    pkce: true,
  },
  notion: {
    authorize: "https://api.notion.com/v1/oauth/authorize",
    token: "https://api.notion.com/v1/oauth/token",
    scopes: "",
  },
};
export function providerCredentials(provider: string) {
  return {
    id: process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_ID`],
    secret: process.env[`OAUTH_${provider.toUpperCase()}_CLIENT_SECRET`],
  };
}
export function integrationConfigured(provider: string) {
  const credentials = providerCredentials(provider);
  return (
    !!OAUTH_PROVIDERS[provider] &&
    !!credentials.id &&
    !!credentials.secret &&
    !!process.env.NEXT_PUBLIC_APP_URL
  );
}
export async function exchangeIntegrationCode(
  provider: string,
  code: string,
  redirectUri: string,
  verifier: string,
) {
  const config = OAUTH_PROVIDERS[provider],
    credentials = providerCredentials(provider);
  if (!config || !credentials.id || !credentials.secret)
    throw new Error("Provider is not configured");
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: credentials.id,
    client_secret: credentials.secret,
  });
  if (config.pkce) params.set("code_verifier", verifier);
  const response = await fetch(config.token, {
    method: "POST",
    headers:
      provider === "notion"
        ? {
            "content-type": "application/json",
            authorization: `Basic ${Buffer.from(credentials.id + ":" + credentials.secret).toString("base64")}`,
            "Notion-Version": "2026-03-11",
          }
        : {
            "content-type": "application/x-www-form-urlencoded",
            accept: "application/json",
          },
    body:
      provider === "notion"
        ? JSON.stringify({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
          })
        : params,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const tokens = object(await response.json());
  if (!response.ok || typeof tokens.access_token !== "string")
    throw new Error("Provider declined the connection");
  const identityResponse = config.identity
    ? await fetch(config.identity, {
        headers: {
          authorization: `Bearer ${tokens.access_token}`,
          accept: "application/json",
          "user-agent": "Weave Settings",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      })
    : null;
  if (identityResponse && !identityResponse.ok)
    throw new Error("Could not read connected account");
  const identity = identityResponse
    ? object(await identityResponse.json())
    : object(object(tokens.owner).user);
  const name = String(
    identity.login ||
      identity.username ||
      identity.name ||
      identity.email ||
      tokens.workspace_name ||
      "",
  );
  if (!name || !(identity.id || identity.sub || tokens.workspace_id))
    throw new Error("Provider returned no account identity");
  const profile =
    typeof identity.html_url === "string"
      ? identity.html_url
      : typeof identity.web_url === "string"
        ? identity.web_url
        : undefined;
  // Connection stores identity only; no provider access/refresh token is retained.
  return {
    name,
    profile,
    permissions: config.scopes
      ? config.scopes.split(" ")
      : ["workspace identity"],
  };
}
