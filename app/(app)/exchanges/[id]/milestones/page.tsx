import { getExchangeMilestones } from "@/app/actions/exchange-workspace";
import { getExchange } from "@/app/actions/exchanges";
import MilestonesClient from "@/components/exchanges/milestones-client";
import { notFound } from "next/navigation";

export default async function MilestonesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [exchangeResult, milestoneResult] = await Promise.all([getExchange(id), getExchangeMilestones(id)]);
  if (!exchangeResult.success || !exchangeResult.exchange || !milestoneResult.success) notFound();
  return <MilestonesClient exchangeId={id} milestones={milestoneResult.milestones} editable={["in_progress", "revision_requested"].includes(exchangeResult.exchange.status)} />;
}
