import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/actions/user";
import {
  OAUTH_PROVIDERS,
  providerCredentials,
  integrationConfigured,
} from "@/lib/integrations";
import { randomBytes, createHash } from "node:crypto";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { uid } = await requireAuth(),
      { provider } = await params;
    if (!integrationConfigured(provider))
      return Response.json(
        { error: "This provider has not been configured by Weave." },
        { status: 503 },
      );
    const config = OAUTH_PROVIDERS[provider],
      state = randomBytes(32).toString("base64url"),
      verifier = randomBytes(32).toString("base64url");
    const redirectUri = new URL(
      `/api/settings/integrations/${provider}/callback`,
      process.env.NEXT_PUBLIC_APP_URL!,
    ).href;
    const url = new URL(config.authorize);
    for (const [key, value] of Object.entries({
      client_id: providerCredentials(provider).id!,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      scope: config.scopes,
    }))
      url.searchParams.set(key, value);
    if (config.pkce) {
      url.searchParams.set(
        "code_challenge",
        createHash("sha256").update(verifier).digest("base64url"),
      );
      url.searchParams.set("code_challenge_method", "S256");
    }
    if (provider === "notion") url.searchParams.set("owner", "user");
    (await cookies()).set(
      `weave_oauth_${provider}`,
      JSON.stringify({ state, verifier, uid }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: `/api/settings/integrations/${provider}`,
        maxAge: 600,
      },
    );
    return NextResponse.redirect(url);
  } catch {
    return Response.json(
      { error: "Sign in to connect an account" },
      { status: 401 },
    );
  }
}
