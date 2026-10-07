import OperationsPage from "@/components/admin/operations-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "verification" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <OperationsPage area="verification" searchParams={searchParams} />;
}
