import { 
  Users, 
  Mail, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  TrendingUp,
  UserPlus,
  Download,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase-admin";

export const metadata = {
  title: "Overview Dashboard"
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export default async function AdminPage() {
  if (!db) {
    return <div className="p-8 text-error">Database connection not initialized.</div>;
  }

  // Fetch data
  const invitesSnapshot = await db.collection("invite_applications").get();

  const totalInvites = invitesSnapshot.size;
  
  let approvedInvites = 0;
  let pendingInvites = 0;
  let invitesToday = 0;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  
  const activities: any[] = [];

  invitesSnapshot.forEach(doc => {
     const data = doc.data();
     if (data.status === "approved") approvedInvites++;
     if (data.status === "pending" || !data.status) pendingInvites++;
     if (data.createdAt && data.createdAt >= startOfToday) invitesToday++;

     if (data.createdAt) {
       activities.push({
         id: doc.id,
         type: "invite",
         name: data.fullName || "Someone",
         action: data.status === "approved" ? "was approved" : data.status === "rejected" ? "was rejected" : "submitted an invite request",
         date: new Date(data.status === "approved" ? (data.approvedAt || data.createdAt) : data.status === "rejected" ? (data.rejectedAt || data.createdAt) : data.createdAt),
         status: data.status || "pending"
       });
     }
  });

  // Sort activities by date desc and take top 5
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentActivity = activities.slice(0, 5);

  const approvalRate = totalInvites > 0 ? Math.round((approvedInvites / totalInvites) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* 1. STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Invite Requests */}
        <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted">Total Invite Requests</h3>
            <div className="w-8 h-8 rounded-full bg-heading flex items-center justify-center">
              <Users className="w-4 h-4 text-background" />
            </div>
          </div>
          <div className="text-3xl font-bold text-heading mb-1">{totalInvites}</div>
          <div className="flex items-center text-xs font-medium text-success gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+{invitesToday} today</span>
          </div>
        </div>

        {/* Approved Invites */}
        <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted">Approved Invites</h3>
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
          </div>
          <div className="text-3xl font-bold text-heading mb-1">{approvedInvites}</div>
          <div className="text-xs font-medium text-muted">
            {approvalRate}% approval rate
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted">Pending Review</h3>
            <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" />
            </div>
          </div>
          <div className="text-3xl font-bold text-heading mb-1">{pendingInvites}</div>
          <div className="flex items-center text-xs font-medium text-warning gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Needs attention</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT (ACTIVITY + QUICK ACTIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle p-6 flex flex-col h-full">
          <h2 className="text-lg font-bold text-heading mb-6">Recent Activity</h2>
          
          <div className="flex-1 space-y-6">
            {recentActivity.length === 0 ? (
              <p className="text-muted text-sm italic">No recent activity found.</p>
            ) : (
              recentActivity.map((activity, index) => {
                const isLast = index === recentActivity.length - 1;
                
                // Determine icon/color based on status
                let colorClass = "bg-primary";
                if (activity.status === "approved") colorClass = "bg-success";
                if (activity.status === "rejected") colorClass = "bg-error";
                if (activity.status === "info") colorClass = "bg-info";

                return (
                  <div key={activity.id + index} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${colorClass} ring-4 ring-background z-10 mt-1.5`} />
                      {!isLast && <div className="absolute top-4 bottom-[-24px] w-[1px] bg-border" />}
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-sm text-heading">
                        <span className="font-semibold">{activity.name}</span> {activity.action}
                      </p>
                      <p className="text-xs text-muted mt-1">{formatTimeAgo(activity.date)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <Link href="/admin/analytics" className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
              View all activity <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle p-6 flex flex-col h-full">
          <h2 className="text-lg font-bold text-heading mb-6">Quick Actions</h2>
          
          <div className="flex flex-col gap-3">
            <Link 
              href="/admin/invites" 
              className="flex items-center gap-3 p-4 rounded-[var(--radius-input)] border border-border bg-background hover:bg-surface-secondary hover:border-heading transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-heading group-hover:bg-heading group-hover:text-background transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-heading group-hover:text-heading transition-colors">Review Invite Requests</div>
                <div className="text-xs text-muted mt-0.5">{pendingInvites} pending review</div>
              </div>
            </Link>

            <Link 
              href="/admin/users" 
              className="flex items-center gap-3 p-4 rounded-[var(--radius-input)] border border-border bg-background hover:bg-surface-secondary hover:border-heading transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-heading group-hover:bg-heading group-hover:text-background transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-heading transition-colors">Manage Users</div>
                <div className="text-xs text-muted mt-0.5">Bypass waitlist</div>
              </div>
            </Link>

            <button 
              className="flex items-center gap-3 p-4 rounded-[var(--radius-input)] border border-border bg-background hover:bg-surface-secondary hover:border-heading transition-all group w-full"
            >
              <div className="w-10 h-10 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-heading group-hover:bg-heading group-hover:text-background transition-colors">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-heading transition-colors">Export Applications</div>
                <div className="text-xs text-muted mt-0.5">Download as CSV</div>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
