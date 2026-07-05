"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import { Search, Download, RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import UsersSummaryCards from "./users-summary-cards";
import UsersTable from "./users-table";
import UserDrawer from "./user-drawer";

interface UsersDashboardClientProps {
  initialUsers: User[];
  summary: any;
}

export default function UsersDashboardClient({ initialUsers, summary }: UsersDashboardClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  
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
        if (statusFilter === "active" && (user.status === "suspended" || user.status === "banned")) return false;
        if (statusFilter !== "active" && user.status !== statusFilter) return false;
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
    setSelectedUser(updatedUser);
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
            onClick={() => router.refresh()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[var(--radius-button)] border border-border bg-background hover:bg-surface-secondary text-heading transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[var(--radius-button)] border border-border bg-background hover:bg-surface-secondary text-heading transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link 
            href="/admin/invites"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-[var(--radius-button)] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-glow"
          >
            <Plus className="w-4 h-4" /> Invite Member
          </Link>
        </div>
      </div>

      <UsersSummaryCards summary={summary} />

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border p-4 rounded-[var(--radius-card)]">
        
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text"
            placeholder="Search by name, email, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-[var(--radius-input)] pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary text-heading placeholder:text-muted"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-heading appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      <UsersTable 
        users={filteredUsers} 
        onRowClick={handleRowClick} 
        selectedUserId={selectedUser?.uid}
      />

      <UserDrawer 
        user={selectedUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUserUpdate}
      />
    </div>
  );
}
