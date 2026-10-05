import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/actions/user";
import {
  exchangeIntegrationCode,
  integrationConfigured,
} from "@/lib/integrations";
import { sql } from "@/lib/neon";
import { object } from "@/lib/settings";
import { revalidatePath } from "next/cache";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const destination = new URL("/settings/connections", origin);
  try {
    const { uid } = await requireAuth();
    if (!integrationConfigured(provider))
      throw new Error("Provider unavailable");
    const store = await cookies(),
      name = `weave_oauth_${provider}`,
      stored = store.get(name)?.value;
    store.set(name, "", {
      path: `/api/settings/integrations/${provider}`,
      maxAge: 0,
    });
    const state = stored ? object(JSON.parse(stored)) : {};
    const url = new URL(request.url),
      code = url.searchParams.get("code");
    if (
      state.uid !== uid ||
      typeof state.verifier !== "string" ||
      !state.state ||
      state.state !== url.searchParams.get("state") ||
      !code ||
      url.searchParams.has("error")
    )
      throw new Error("Invalid or expired authorization");
    const account = await exchangeIntegrationCode(
      provider,
      code,
      new URL(`/api/settings/integrations/${provider}/callback`, origin).href,
      state.verifier,
    );
    await sql.query(
      "insert into user_integrations(user_id,provider,account_name,profile_url,permissions) values($1,$2,$3,$4,$5::jsonb) on conflict(user_id,provider) do update set account_name=excluded.account_name,profile_url=excluded.profile_url,permissions=excluded.permissions,connected_at=now()",
      [
        uid,
        provider,
        account.name,
        account.profile || null,
        JSON.stringify(account.permissions),
      ],
    );
    revalidatePath("/settings/connections");
    destination.searchParams.set("connected", provider);
  } catch {
    destination.searchParams.set(
      "error",
      "Connection was declined or expired. Please retry.",
    );
  }
  return NextResponse.redirect(destination);
}
