import { getExchange } from "@/app/actions/exchanges";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/actions/user";
import { hasUserReviewed } from "@/app/actions/reviews";
import WorkspaceSidebar from "@/components/exchanges/workspace-sidebar";
import WorkspaceHeader from "@/components/exchanges/workspace-header";

export default async function ExchangeWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/api/auth/logout");
  }

  const result = await getExchange(id);

  if (!result.success || !result.exchange) {
    if (result.error === "Unauthorized access to exchange") {
      redirect("/dashboard");
    }
    notFound();
  }

  const { exchange, requester, provider } = result;
  const isRequester = userId === exchange.requesterId;
  const otherParty = isRequester ? provider : requester;
  
  const { hasReviewed } = await hasUserReviewed(id);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Sidebar */}
      <WorkspaceSidebar exchangeId={id} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <WorkspaceHeader 
          exchange={exchange} 
          otherParty={otherParty} 
          isRequester={isRequester} 
          hasReviewed={hasReviewed}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
