"use client";

import { User } from "@/types";
import { BadgeCheck, ShieldAlert, ShieldCheck, Shield, Ban } from "lucide-react";
import { calculateTrustScore } from "@/lib/user-metrics";

interface UsersTableProps {
  users: User[];
  onRowClick: (user: User) => void;
  selectedUserId?: string | null;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function UsersTable({ users, onRowClick, selectedUserId }: UsersTableProps) {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-secondary border-b border-border text-muted uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Trust</th>
              <th className="px-6 py-4 text-right">Hours</th>
              <th className="px-6 py-4 text-right">Exchanges</th>
              <th className="px-6 py-4 text-right">Completion</th>
              <th className="px-6 py-4">Last Active</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-muted">
                  No users match your criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr 
                  key={user.uid} 
                  onClick={() => onRowClick(user)}
                  className={`cursor-pointer transition-colors group ${selectedUserId === user.uid ? 'bg-surface-secondary border-l-2 border-l-primary' : 'hover:bg-surface-secondary border-l-2 border-l-transparent'}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs font-bold text-heading">
                          {user.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-heading flex items-center gap-1">
                          {user.fullName}
                          {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <div className="text-xs text-muted truncate max-w-[150px]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'Admin' ? 'bg-primary/10 text-primary' : 
                      user.role === 'Moderator' ? 'bg-info/10 text-info' : 
                      'bg-border/50 text-muted'
                    }`}>
                      {user.role || 'Member'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`font-bold flex items-center gap-1 ${
                        calculateTrustScore(user) >= 90 ? 'text-success' :
                        calculateTrustScore(user) >= 70 ? 'text-info' :
                        calculateTrustScore(user) >= 40 ? 'text-warning' :
                        'text-error'
                      }`}>
                        {calculateTrustScore(user) >= 70 ? <ShieldCheck className="w-3.5 h-3.5" /> : 
                         calculateTrustScore(user) >= 40 ? <Shield className="w-3.5 h-3.5" /> : 
                         <ShieldAlert className="w-3.5 h-3.5" />}
                        {calculateTrustScore(user)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-body">
                    {user.skillHours || 0}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-body">
                    {user.stats?.exchangesCompleted || 0}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-body">
                    {user.profileCompletion}%
                  </td>
                  <td className="px-6 py-4 text-muted text-xs">
                    {user.lastActive ? timeAgo(user.lastActive) : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'suspended' ? (
                      <span className="inline-flex items-center gap-1 text-warning bg-warning/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        <ShieldAlert className="w-3 h-3" /> Suspended
                      </span>
                    ) : user.status === 'banned' ? (
                      <span className="inline-flex items-center gap-1 text-error bg-error/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        <Ban className="w-3 h-3" /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted bg-border/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-muted font-bold tracking-widest group-hover:text-primary transition-colors">
                    •••
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
