"use client";

import { useState } from "react";
import { Search, Copy, RefreshCw, Clock, Ban } from "lucide-react";
import { revokeInviteCode, extendInviteCode } from "@/app/actions/admin/invite-codes";

interface IssuedCodesTableProps {
  initialData: any[];
}

export default function IssuedCodesTable({ initialData }: IssuedCodesTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = data.filter(item => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    
    if (search) {
      const query = search.toLowerCase();
      const matchesEmail = (item.email || "").toLowerCase().includes(query);
      const matchesCode = (item.code || "").toLowerCase().includes(query);
      if (!matchesEmail && !matchesCode) return false;
    }
    
    return true;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(`https://weave.network/signup?invite=${code}`);
    alert("Invite link copied to clipboard!");
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invite code? It will immediately become unusable.")) return;
    
    const result = await revokeInviteCode(id);
    if (result.success) {
      setData(prev => prev.map(item => item.id === id ? { ...item, status: "revoked" } : item));
    } else {
      alert("Error revoking invite");
    }
  };

  const handleExtend = async (id: string) => {
    const days = prompt("How many additional days should this invite be extended by?", "7");
    if (!days) return;
    const parsed = parseInt(days);
    if (isNaN(parsed)) return;

    const result = await extendInviteCode(id, parsed);
    if (result.success) {
      alert("Invite extended successfully. Please refresh the page to see the new expiration date.");
      setData(prev => prev.map(item => item.id === id ? { ...item, status: "pending" } : item));
    } else {
      alert("Error extending invite");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border p-4 rounded-[var(--radius-card)]">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text"
            placeholder="Search code or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-[var(--radius-input)] text-sm focus:outline-none focus:border-primary text-body"
          />
        </div>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-heading appearance-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary border-b border-border text-muted uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Invite Code</th>
                <th className="px-6 py-4 font-semibold">Issued To</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Expires At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted">
                    No issued invite codes found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
                  const actualStatus = isExpired && item.status === "pending" ? "expired" : item.status;

                  return (
                    <tr key={item.id} className="hover:bg-surface-secondary transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-mono text-heading bg-background border border-border px-2 py-1 rounded inline-block">
                          {item.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body">{item.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                          actualStatus === 'used' ? 'bg-success/10 text-success' :
                          actualStatus === 'revoked' ? 'bg-error/10 text-error' :
                          actualStatus === 'expired' ? 'bg-warning/10 text-warning' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {actualStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted text-xs">
                        {item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleCopy(item.code)}
                            className="p-2 text-muted hover:text-primary transition-colors rounded-md hover:bg-background"
                            title="Copy Signup Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleExtend(item.id)}
                            disabled={item.status === 'used' || item.status === 'revoked'}
                            className="p-2 text-muted hover:text-info transition-colors rounded-md hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Extend Expiration"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRevoke(item.id)}
                            disabled={item.status === 'used' || item.status === 'revoked'}
                            className="p-2 text-muted hover:text-error transition-colors rounded-md hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Revoke Invite"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
