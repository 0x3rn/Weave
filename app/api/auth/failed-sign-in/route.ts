import { createHash } from "node:crypto";
import { sql } from "@/lib/neon";
import { object } from "@/lib/settings";
export async function POST(request: Request) {
  // Reports are accepted only after the provider independently confirms invalid credentials.
  const response = () =>
    new Response(null, {
      status: 204,
      headers: { "cache-control": "no-store" },
    });
  try {
    if (
      request.headers.get("origin") !==
        new URL(process.env.NEXT_PUBLIC_APP_URL || request.url).origin ||
      Number(request.headers.get("content-length") || 0) > 8000
    )
      return response();
    const raw = await request.text();
    if (raw.length > 8000) return response();
    const data = object(JSON.parse(raw));
    if (
      typeof data.email !== "string" ||
      data.email.length > 320 ||
      typeof data.password !== "string" ||
      !data.password ||
      data.password.length > 1000
    )
      return response();
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!key) return response();
    const ip = (
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "unknown"
    )
      .split(",")[0]
      .trim();
    const digest = createHash("sha256").update(ip).digest("hex");
    const [rate] = await sql.query(
      "insert into sign_in_failure_windows(key,attempts) values($1,1) on conflict(key) do update set attempts=case when sign_in_failure_windows.window_at<now()-interval '15 minutes' then 1 else sign_in_failure_windows.attempts+1 end,window_at=case when sign_in_failure_windows.window_at<now()-interval '15 minutes' then now() else sign_in_failure_windows.window_at end returning attempts",
      ["ip:" + digest],
    );
    if (Number(rate.attempts) > 30) return response();
    const verification = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          returnSecureToken: true,
        }),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      },
    );
    const result = object(await verification.json()),
      error = object(result.error);
    if (
      verification.ok ||
      ![
        "INVALID_LOGIN_CREDENTIALS",
        "INVALID_PASSWORD",
        "EMAIL_NOT_FOUND",
      ].includes(String(error.message))
    )
      return response();
    const [member] = await sql.query(
      "select id from users where lower(email)=lower($1) and coalesce(account_status,'active')='active'",
      [data.email],
    );
    if (!member) return response();
    await sql.query(
      "with failure as(insert into sign_in_failure_windows(key,attempts) values($1,1) on conflict(key) do update set attempts=case when sign_in_failure_windows.window_at<now()-interval '15 minutes' then 1 else sign_in_failure_windows.attempts+1 end,window_at=case when sign_in_failure_windows.window_at<now()-interval '15 minutes' then now() else sign_in_failure_windows.window_at end returning attempts,window_at) select publish_member_notification('failed-sign-ins:'||$2||':'||window_at::text,$2,'failed_login_attempts','Multiple failed sign-in attempts','At least five unsuccessful password sign-ins were verified in the last fifteen minutes. Review your account security.','/settings/security') from failure where attempts=5",
      ["member:" + member.id, member.id],
    );
  } catch {
    /* No credentials, account existence, or provider errors are exposed or logged. */
  }
  return response();
}
