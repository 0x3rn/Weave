import { getAdminDisputes } from "@/app/actions/admin/disputes";
import DisputeResolutionClient from "@/components/admin/disputes/dispute-resolution-client";

export const metadata = {
  title: "Resolution Center"
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { disputes } = await getAdminDisputes();
  return <div className="mx-auto max-w-5xl"><div className="mb-8"><h1 className="text-3xl font-black text-heading">Resolution Center</h1><p className="mt-2 text-muted">Review the exchange record, distribute the held Skill Hours, and record the decision.</p></div><DisputeResolutionClient disputes={disputes} /></div>;
}
