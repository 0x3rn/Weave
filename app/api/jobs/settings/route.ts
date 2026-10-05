import { timingSafeEqual } from "node:crypto";
import { deliverNotificationEmails } from "@/lib/notification-email";
import { completeDueDeletions } from "@/lib/account-maintenance";
import {
  generateNotificationActivity,
  deliverProductivityDigests,
} from "@/lib/notification-maintenance";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET,
    supplied = request.headers.get("authorization") || "";
  if (!secret || secret.length < 32)
    return Response.json(
      { error: "Background jobs are not configured" },
      { status: 503 },
    );
  const expected = Buffer.from(`Bearer ${secret}`),
    actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const activity = await generateNotificationActivity();
    const digest = await deliverProductivityDigests();
    const email = await deliverNotificationEmails();
    const deletion = await completeDueDeletions();
    return Response.json(
      { activity, digest, email, deletion },
      {
        status:
          activity.failed || digest.failed || deletion.failed || email.failed
            ? 503
            : 200,
        headers: { "cache-control": "no-store" },
      },
    );
  } catch {
    return Response.json(
      { error: "Background maintenance failed; retry required" },
      { status: 503 },
    );
  }
}
export const GET = POST;
