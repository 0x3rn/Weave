import { getInviteApplications } from "@/app/actions/admin/invites";
import { getIssuedInvites } from "@/app/actions/admin/invite-codes";
import InvitesTable from "@/components/admin/invites/invites-table";
import IssuedCodesTable from "@/components/admin/invites/issued-codes-table";
import Link from "next/link";

export const metadata = {
  title: "Invite Requests"
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminInvitesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const currentTab = searchParams.tab || "requests";

  let result: any = null;
  if (currentTab === "requests") {
    result = await getInviteApplications();
  } else {
    result = await getIssuedInvites();
  }

  if (result.error) {
    return (
      <div className="p-8 text-error bg-error/10 border border-error/20 rounded-md">
        Error loading invite applications: {result.error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-heading">Invite Management</h1>
          <p className="text-sm text-body">
            Review applications and manage issued invite codes for the platform.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        <Link 
          href="/admin/invites?tab=requests"
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${currentTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-heading hover:border-border'}`}
        >
          Invite Requests
        </Link>
        <Link 
          href="/admin/invites?tab=issued"
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${currentTab === 'issued' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-heading hover:border-border'}`}
        >
          Issued Codes
        </Link>
      </div>

      {currentTab === "requests" ? (
        <InvitesTable initialData={result?.applications || []} />
      ) : (
        <IssuedCodesTable initialData={result?.invites || []} />
      )}
    </div>
  );
}
