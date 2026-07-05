"use client";

import { useState, useMemo } from "react";
import { Search, Eye, CheckCircle, XCircle } from "lucide-react";
import InviteDrawer from "./invite-drawer";
import ApproveModal from "./approve-modal";
import RejectModal from "./reject-modal";

interface InvitesTableProps {
  initialData: any[];
}

export default function InvitesTable({ initialData }: InvitesTableProps) {
  const [data, setData] = useState(initialData);
  
  // Filtering & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");

  // Drawer & Modals State
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Derive unique professions for filter
  const professions = useMemo(() => {
    const profs = new Set(data.map(d => d.profession).filter(Boolean));
    return Array.from(profs).sort();
  }, [data]);

  // Filter the data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Status Match
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && item.status && item.status !== "pending") return false;
        if (statusFilter !== "pending" && item.status !== statusFilter) return false;
      }
      
      // Profession Match
      if (professionFilter !== "all" && item.profession !== professionFilter) return false;
      
      // Search Match
      if (search) {
        const query = search.toLowerCase();
        const matchesName = (item.fullName || "").toLowerCase().includes(query);
        const matchesEmail = (item.email || "").toLowerCase().includes(query);
        const matchesCountry = (item.country || "").toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesCountry) return false;
      }
      
      return true;
    });
  }, [data, search, statusFilter, professionFilter]);

  // Actions
  const handleView = (application: any) => {
    setSelectedApplication(application);
    setIsDrawerOpen(true);
  };

  const openApprove = (application: any) => {
    setSelectedApplication(application);
    setIsApproveModalOpen(true);
  };

  const openReject = (application: any) => {
    setSelectedApplication(application);
    setIsRejectModalOpen(true);
  };

  const onUpdateSuccess = (id: string, newStatus: string) => {
    // Update local state without refreshing
    setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    
    // If the drawer is open for this item, update it too
    if (selectedApplication && selectedApplication.id === id) {
      setSelectedApplication({ ...selectedApplication, status: newStatus });
    }
  };

  const onNotesSaved = (id: string, notes: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, internalNotes: notes } : item));
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border p-4 rounded-[var(--radius-card)]">
        
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text"
            placeholder="Search name, email, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-[var(--radius-input)] text-sm focus:outline-none focus:border-primary text-body"
          />
        </div>

        {/* Filters */}
        <div className="flex w-full sm:w-auto gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-heading appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select 
            value={professionFilter}
            onChange={(e) => setProfessionFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-background border border-border rounded-[var(--radius-input)] px-3 py-2 text-sm focus:outline-none focus:border-primary text-heading appearance-none max-w-[200px]"
          >
            <option value="all">All Professions</option>
            {professions.map(p => (
              <option key={p as string} value={p as string}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-[var(--radius-card)] overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary border-b border-border text-muted uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Applicant</th>
                <th className="px-6 py-4 font-semibold">Profession</th>
                <th className="px-6 py-4 font-semibold">Experience</th>
                <th className="px-6 py-4 font-semibold">Country</th>
                <th className="px-6 py-4 font-semibold">Applied</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-secondary transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-heading">{item.fullName}</div>
                      <div className="text-xs text-muted">{item.email}</div>
                    </td>
                    <td className="px-6 py-4 text-body">{item.profession}</td>
                    <td className="px-6 py-4 text-body">{item.experience}</td>
                    <td className="px-6 py-4 text-body">{item.country}</td>
                    <td className="px-6 py-4 text-body">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                        item.status === 'approved' ? 'bg-success/10 text-success' :
                        item.status === 'rejected' ? 'bg-error/10 text-error' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {item.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => handleView(item)}
                          className="p-2 text-muted hover:text-primary transition-colors rounded-md hover:bg-background"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openApprove(item)}
                          disabled={item.status === 'approved'}
                          className="p-2 text-muted hover:text-success transition-colors rounded-md hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openReject(item)}
                          disabled={item.status === 'rejected'}
                          className="p-2 text-muted hover:text-error transition-colors rounded-md hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Drawer */}
      <InviteDrawer 
        application={selectedApplication}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={(app) => { setIsDrawerOpen(false); openApprove(app); }}
        onReject={(app) => { setIsDrawerOpen(false); openReject(app); }}
        onNotesSaved={onNotesSaved}
      />

      <ApproveModal 
        application={selectedApplication}
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onSuccess={(id) => onUpdateSuccess(id, 'approved')}
      />

      <RejectModal 
        application={selectedApplication}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSuccess={(id) => onUpdateSuccess(id, 'rejected')}
      />
      
    </div>
  );
}
