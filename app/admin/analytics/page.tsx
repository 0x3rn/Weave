import { getAdminAnalytics } from "@/lib/admin-analytics";
import AnalyticsClient from "@/components/admin/analytics-client";
export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const p = await searchParams;
  return <AnalyticsClient data={await getAdminAnalytics(p.from, p.to)} />;
}
