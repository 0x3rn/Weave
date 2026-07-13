import { getExchange } from "@/app/actions/exchanges";
import { getDeliverables } from "@/app/actions/deliverables";
import { getCurrentUserId } from "@/app/actions/user";
import { notFound, redirect } from "next/navigation";
import SubmitDeliverableClient from "@/components/exchanges/submit-deliverable-client";

export default async function ExchangeFilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  const [exchangeResult, deliveriesResult] = await Promise.all([
    getExchange(id),
    getDeliverables(id)
  ]);

  if (!exchangeResult.success || !exchangeResult.exchange) {
    notFound();
  }

  const { exchange } = exchangeResult;
  const isProvider = userId === exchange.providerId;
  const deliveries = deliveriesResult.deliveries || [];

  return (
    <SubmitDeliverableClient 
      exchange={exchange} 
      isProvider={isProvider} 
      deliveries={deliveries} 
      userId={userId}
    />
  );
}
