import { getExchange } from "@/app/actions/exchanges";
import { getCurrentUserId } from "@/app/actions/user";
import { notFound, redirect } from "next/navigation";
import ExchangeMessages from "@/components/exchanges/exchange-messages";

export default async function ExchangeMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  const result = await getExchange(id);

  if (!result.success || !result.exchange) {
    notFound();
  }

  const { exchange, requester, provider } = result;
  const isRequester = userId === exchange.requesterId;
  const otherParty = isRequester ? provider : requester;

  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-heading">Messages</h2>
        <p className="text-sm text-muted">Communicate directly in your dedicated workspace.</p>
      </div>
      
      <ExchangeMessages 
        exchangeId={exchange.id}
        currentUserId={userId}
        otherPartyName={otherParty.name}
        otherPartyAvatar={otherParty.avatar}
      />
    </div>
  );
}
