import { getConversations, getOrCreateExchangeConversation } from "@/app/actions/messages";
import { getCurrentUserId } from "@/app/actions/user";
import { notFound, redirect } from "next/navigation";
import ChatArea from "@/components/workspace/chat-area";

export default async function ExchangeMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  const created = await getOrCreateExchangeConversation(id);
  if (!created.success) notFound();
  const result = await getConversations();
  const conversation = result.success ? result.conversations.find(item => item.id === id) : undefined;
  if (!conversation) notFound();

  return (
    <div className="flex h-full min-h-[500px] overflow-hidden rounded-xl border border-border bg-surface">
      <div className="min-w-0 flex-1">
        <ChatArea conversation={conversation} currentUserId={userId} embedded />
      </div>
    </div>
  );
}
