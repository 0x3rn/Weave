"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import { Search, Download, RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import UsersSummaryCards from "./users-summary-cards";
import UsersTable from "./users-table";
import UserDrawer from "./user-drawer";
import { summarizeAdminUsers } from "@/lib/admin-summary";
import { downloadCsv } from "@/lib/csv";

interface UsersDashboardClientProps {
  initialUsers: User[];
  summary: ReturnType<typeof summarizeAdminUsers>;
  timeZone?: string;
}

export default function UsersDashboardClient({ initialUsers, summary, timeZone = "UTC" }: UsersDashboardClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isPending, startTransition] = useTransition();

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Drawer state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (statusFilter !== "all") {
        if (user.status !== statusFilter) return false;
      }

      if (roleFilter !== "all" && (user.role || 'Member') !== roleFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchName = user.fullName?.toLowerCase().includes(q);
        const matchEmail = user.email?.toLowerCase().includes(q);
        const matchUsername = user.username?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchUsername) return false;
      }

      return true;
    });
  }, [users, search, statusFilter, roleFilter]);

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.uid === updatedUser.uid ? updatedUser : u));
    setSelectedUser(current => current?.uid === updatedUser.uid ? updatedUser : current);
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-6">

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Users</h1>
          <p className="text-sm text-body">Manage members, invitations, verification, account health, and community activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => startTransition(() => router.refresh())}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[var(--radius-button)] border border-border bg-background hover:bg-surface-secondary text-heading transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin text-primary' : ''}`} /> Refresh
          </button>
          <button onClick={() => downloadCsv("weave-users.csv", [["Name","Email","Username","Role","Status","Verified","Skill Hours","Created"], ...filteredUsers.map(u => [u.fullName,u.email,u.username,u.role,u.status,u.isVerified,u.skillHours,u.createdAt])])} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[var(--radius-button)] border border-border bg-background hover:bg-surface-secondary text-heading transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link
            href="/admin/invites?tab=issued"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[var(--radius-button)] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-glow"
          >
            <Plus className="w-4 h-4" /> Invite Member
          </Link>
        </div>
      </div>

      <UsersSummaryCards summary={summarizeAdminUsers(users, summary.pendingInvites, timeZone)} />

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border p-4 rounded-[var(--radius-card)]">

        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            aria-label="Search members"
            placeholder="Search by name, email, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary text-heading placeholder:text-muted"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            aria-label="Member role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-heading appearance-none"
          >
            <option value="all">All Roles</option>
            <option value="Member">Member</option>
            <option value="Moderator">Moderator</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            aria-label="Account status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-heading appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="deactivated">Deactivated</option>
            <option value="deletion_pending">Deletion pending</option>
            <option value="deletion_processing">Deletion processing</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      <UsersTable
        users={filteredUsers}
        onRowClick={handleRowClick}
        selectedUserId={selectedUser?.uid}
      />

      {isDrawerOpen && selectedUser && <UserDrawer key={selectedUser.uid}
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUserUpdate}
      />}
    </div>
  );
}
