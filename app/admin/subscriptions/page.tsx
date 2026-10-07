import OperationsPage from "@/components/admin/operations-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "subscriptions" };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <OperationsPage area="subscriptions" searchParams={searchParams} />;
}
