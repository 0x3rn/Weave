import { getCurrentUserId } from "@/app/actions/user";
import { sql } from "@/lib/neon";
import { notFound, redirect } from "next/navigation";

export default async function IdPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const { id } = await params;
  const [escrow] = await sql.query("select id from escrows where id=$1 and participants ? $2", [id, userId]);
  if (!escrow) notFound();
  redirect(`/dashboard/escrow/${id}`);
}
