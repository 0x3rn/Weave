import { getActiveEscrows } from "@/app/actions/escrow";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "My Disputes | Weave" };
export const dynamic = "force-dynamic";

export default async function DisputesPage() {
  const result = await getActiveEscrows();
  if (!result.success && result.error === "Unauthorized") redirect("/login");
  const disputes = (result.escrows || []).filter(escrow => escrow.status === "disputed" || escrow.dispute?.status === "investigating");
  return <main className="mx-auto max-w-4xl px-4 py-10"><Link href="/exchanges" className="inline-flex items-center gap-2 text-sm font-bold text-muted"><ArrowLeft className="h-4 w-4" />Back to exchanges</Link><h1 className="mt-6 text-3xl font-black text-heading">My disputes</h1><p className="mt-2 text-muted">Disputed exchanges stay frozen until the resolution is recorded.</p><div className="mt-8 space-y-4">{disputes.length ? disputes.map(escrow => <Link key={escrow.id} href={`/dashboard/escrow/${escrow.id}`} className="block rounded-[var(--radius-card)] border border-error/20 bg-surface p-5 hover:border-error/50"><div className="flex items-center gap-2 font-bold text-error"><AlertTriangle className="h-4 w-4" />Under review</div><p className="mt-2 font-bold text-heading">{escrow.dispute?.reason || "Exchange dispute"}</p><p className="mt-1 line-clamp-2 text-sm text-muted">{escrow.dispute?.details}</p></Link>) : <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-10 text-center text-muted">You have no open disputes.</div>}</div></main>;
}
