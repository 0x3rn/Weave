import { getCurrentUserId } from "@/app/actions/user";
import { getConversations } from "@/app/actions/messages";
import { redirect } from "next/navigation";
import WorkspaceLayout from "@/components/workspace/workspace-layout";

export const metadata = {
  title: "Exchange Workspace | Weave"
};

export default async function MessagesPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const result = await getConversations();
  const conversations = result.success ? (result.conversations || []) : [];

  return (
    <div className="h-full w-full flex overflow-hidden">
      <WorkspaceLayout 
        conversations={conversations} 
        currentUserId={userId} 
      />
    </div>
  );
}
