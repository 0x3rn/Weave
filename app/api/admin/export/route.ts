import { requireAdminUser } from "@/app/actions/admin/auth";
import { sql } from "@/lib/neon";
import { toCsv } from "@/lib/csv";
export async function GET() {
  try {
    await requireAdminUser();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const rows = await sql.query(
      "select full_name,email,status,submitted_at,approved_at from invite_applications order by submitted_at desc",
    );
    return new Response(
      toCsv([
        ["Name", "Email", "Status", "Submitted", "Approved"],
        ...rows.map((row) => [
          row.full_name,
          row.email,
          row.status || "pending",
          row.submitted_at instanceof Date
            ? row.submitted_at.toISOString()
            : row.submitted_at,
          row.approved_at instanceof Date
            ? row.approved_at.toISOString()
            : row.approved_at,
        ]),
      ]),
      {
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
          "Content-Disposition":
            'attachment; filename="weave-invite-applications.csv"',
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "Unable to export applications" },
      { status: 503 },
    );
  }
}
