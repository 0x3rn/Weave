import { getAdminUsersDashboard } from "@/app/actions/admin/users";
import UsersDashboardClient from "@/components/admin/users/users-dashboard-client";

export const metadata = {
  title: "User Management"
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const data = await getAdminUsersDashboard();

  if (data.error) {
    return (
      <div className="p-8 text-error bg-error/10 border border-error/20 rounded-md">
        Failed to load users: {data.error}
      </div>
    );
  }

  return <UsersDashboardClient initialUsers={(data.users as any) || []} summary={data.summary} />;
}
