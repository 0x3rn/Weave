import PlatformReportForm from "@/components/platform-report-form";
import { requireAuth } from "@/app/actions/user";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { type } = await searchParams;
  return <PlatformReportForm id={id} type={type || "member"} />;
}
