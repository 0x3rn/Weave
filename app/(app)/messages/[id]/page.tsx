import { getCurrentUserId } from "@/app/actions/user";
import { getConversations } from "@/app/actions/messages";
import { redirect } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/workspace-layout";

export const metadata = {
  title: "Exchange Workspace | Weave"
};

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const result = await getConversations();
  const conversations = result.success ? (result.conversations || []) : [];

  const activeConversation = conversations.find(c => c.id === params.id);

  if (!activeConversation) {
    // Fallback if not found (maybe they just created it or are not a participant)
    redirect("/messages");
  }

  // Use full height of the main container
  return (
    <div className="h-full w-full flex overflow-hidden">
      <WorkspaceLayout 
        conversations={conversations} 
        currentUserId={userId} 
        activeConversation={activeConversation}
      />
    </div>
  );
}
