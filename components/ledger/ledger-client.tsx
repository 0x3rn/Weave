"use client";

import { useState } from "react";
import { LedgerTransaction, TransactionType, TransactionStatus } from "@/types";
import { 
  ArrowDownToLine, Printer, HelpCircle, Download, ExternalLink, Flame, TrendingUp, FilterIcon, Calendar, ArrowUpDown,
  ArrowUpRight, ArrowDownRight, Lock, 
  RotateCcw, History, Search, Filter,
  X, CheckCircle2, AlertCircle, Clock, SearchX,
  MoreVertical, FileText, Gift, Award, Shield, HelpCircle as QuestionMark
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';

interface LedgerClientProps {
  initialData: {
    transactions: LedgerTransaction[];
    stats: any;
    insights: any;
    chartData7Days: any[];
    chartData30Days: any[];
    chartData6Months: any[];
    chartData1Year: any[];
    chartDataThisYear: any[];
    chartDataAllTime: any[];
  };
}

const TYPE_CONFIG: Record<TransactionType, { color: string, icon: any, bg: string }> = {
  "Earned": { color: "text-success", bg: "bg-success/10", icon: ArrowDownRight },
  "Spent": { color: "text-error", bg: "bg-error/10", icon: ArrowUpRight },
  "Reserved": { color: "text-warning", bg: "bg-warning/10", icon: Lock },
  "Released": { color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
  "Refunded": { color: "text-primary", bg: "bg-primary/10", icon: RotateCcw },
  "Adjustment": { color: "text-purple-500", bg: "bg-purple-500/10", icon: FileText },
  "Bonus": { color: "text-success", bg: "bg-success/10", icon: Gift },
  "Welcome Credit": { color: "text-success", bg: "bg-success/10", icon: Award },
  "Dispute Resolution": { color: "text-purple-500", bg: "bg-purple-500/10", icon: AlertCircle },
  "Admin Correction": { color: "text-purple-500", bg: "bg-purple-500/10", icon: FileText },
  "Transfer Reversal": { color: "text-error", bg: "bg-error/10", icon: RotateCcw }
};

const STATUS_CONFIG: Record<TransactionStatus, string> = {
  "Completed": "text-success bg-success/10",
  "Pending": "text-muted bg-surface-secondary border-border border",
  "Active": "text-warning bg-warning/10",
  "Failed": "text-error bg-error/10",
  "Disputed": "text-error bg-error/10"
};

export default function LedgerClient({ initialData }: LedgerClientProps) {
  const { 
    transactions, stats, insights, 
    chartData7Days, chartData30Days, chartData6Months, 
    chartData1Year, chartDataThisYear, chartDataAllTime 
  } = initialData;
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterDate, setFilterDate] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<LedgerTransaction | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<string>("30 Days");

  const currentChartData = chartTimeframe === "7 Days" ? chartData7Days :
                           chartTimeframe === "30 Days" ? chartData30Days :
                           chartTimeframe === "6 Months" ? chartData6Months :
                           chartTimeframe === "1 Year" ? chartData1Year :
                           chartTimeframe === "This Year" ? chartDataThisYear :
                           chartDataAllTime;

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.exchangeId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "All" || tx.type === filterType;
    const matchesStatus = filterStatus === "All" || tx.status === filterStatus;
    
    let matchesDate = true;
    const txDate = new Date(tx.date);
    const now = new Date();
    if (filterDate === "Today") {
      matchesDate = txDate.toDateString() === now.toDateString();
    } else if (filterDate === "This Week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = txDate >= oneWeekAgo;
    } else if (filterDate === "This Month") {
      matchesDate = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  }).sort((a, b) => {
    if (sortBy === "Newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === "Oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === "Highest Hours") return Math.abs(b.amount) - Math.abs(a.amount);
    if (sortBy === "Lowest Hours") return Math.abs(a.amount) - Math.abs(b.amount);
    return 0;
  });

  const activeReservations = transactions.filter(tx => tx.type === "Reserved" && tx.status === "Active");
  const pendingReleases = transactions.filter(tx => tx.status === "Pending");

  return (
    <div className="flex-1 pb-16">
      
      {/* PAGE HEADER */}
      <div className="bg-surface border-b border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-heading">Skill Hour Ledger</h1>
            <p className="text-body mt-2 max-w-2xl">
              Track every Skill Hour you've earned, spent, reserved, refunded, or adjusted. 
              Every transaction is permanently recorded for transparency and accountability.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button className="px-4 py-2 border border-border text-heading bg-background hover:bg-surface-secondary rounded-[var(--radius-button)] transition-colors flex items-center gap-2 text-sm font-medium shadow-subtle">
              <Printer className="w-4 h-4" /> Print Statement
            </button>
            <button className="px-4 py-2 border border-border text-heading bg-background hover:bg-surface-secondary rounded-[var(--radius-button)] transition-colors flex items-center gap-2 text-sm font-medium shadow-subtle">
              <ArrowDownToLine className="w-4 h-4" /> Download CSV
            </button>
            <button className="px-4 py-2 border border-border text-heading bg-background hover:bg-surface-secondary rounded-[var(--radius-button)] transition-colors flex items-center gap-2 text-sm font-medium shadow-subtle">
              <HelpCircle className="w-4 h-4" /> Help
            </button>
            <button className="px-4 py-2 bg-primary text-background hover:bg-primary-hover rounded-[var(--radius-button)] transition-colors flex items-center gap-2 text-sm font-bold shadow-[0_0_15px_rgba(88,199,109,0.3)]">
              <FileText className="w-4 h-4" /> Export Statement
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* BALANCE OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle flex flex-col">
            <span className="text-muted text-sm font-medium mb-2">Current Balance</span>
            <div className="text-3xl font-bold text-heading mb-1">{stats.currentBalance} <span className="text-base font-normal text-muted">hrs</span></div>
            <p className="text-xs text-primary mt-auto">Available to spend</p>
          </div>
          <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle flex flex-col">
            <span className="text-muted text-sm font-medium mb-2">Reserved Hours</span>
            <div className="text-3xl font-bold text-heading mb-1">{stats.reservedBalance} <span className="text-base font-normal text-muted">hrs</span></div>
            <p className="text-xs text-warning mt-auto">Locked in active exchanges</p>
          </div>
          <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle flex flex-col">
            <span className="text-muted text-sm font-medium mb-2">Lifetime Earned</span>
            <div className="text-3xl font-bold text-heading mb-1">{stats.lifetimeEarned} <span className="text-base font-normal text-muted">hrs</span></div>
            <p className="text-xs text-muted mt-auto">Total hours contributed</p>
          </div>
          <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle flex flex-col">
            <span className="text-muted text-sm font-medium mb-2">Lifetime Spent</span>
            <div className="text-3xl font-bold text-heading mb-1">{stats.lifetimeSpent} <span className="text-base font-normal text-muted">hrs</span></div>
            <p className="text-xs text-muted mt-auto">Total hours received</p>
          </div>
        </div>

        {/* MIDDLE ROW: BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Balance Breakdown */}
          <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle lg:col-span-1 h-fit">
            <h3 className="font-bold text-heading mb-6">Balance Breakdown</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-heading flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div> Available
                  </div>
                  <p className="text-xs text-muted mt-1">Can be used immediately.</p>
                </div>
                <div className="text-xl font-bold text-heading">{stats.currentBalance}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-heading flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning"></div> Reserved
                  </div>
                  <p className="text-xs text-muted mt-1">Temporarily locked.</p>
                </div>
                <div className="text-xl font-bold text-heading">{stats.reservedBalance}</div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-heading flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-border"></div> Pending
                  </div>
                  <p className="text-xs text-muted mt-1">Waiting for confirmation.</p>
                </div>
                <div className="text-xl font-bold text-heading">{stats.pendingBalance}</div>
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center">
                <div className="font-bold text-heading">Total Value</div>
                <div className="text-xl font-bold text-primary">{stats.currentBalance + stats.reservedBalance + stats.pendingBalance} hrs</div>
              </div>
            </div>
          </div>

          {/* Activity Graph */}
          <div className="bg-surface border border-border p-6 rounded-[var(--radius-card)] shadow-subtle lg:col-span-3 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-heading">Activity Overview</h3>
              <select 
                className="bg-background border border-border text-sm text-heading rounded-[var(--radius-input)] px-3 py-1"
                value={chartTimeframe}
                onChange={(e) => setChartTimeframe(e.target.value)}
              >
                <option value="7 Days">Last 7 Days</option>
                <option value="30 Days">Last 30 Days</option>
                <option value="6 Months">Last 6 Months</option>
                <option value="1 Year">Last 1 Year</option>
                <option value="This Year">This Year</option>
                <option value="All Time">All Time</option>
              </select>
            </div>
            
            <div className="h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                    contentStyle={{backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px'}}
                    itemStyle={{color: 'var(--heading)'}}
                  />
                  <Legend wrapperStyle={{fontSize: '12px', color: '#888'}} />
                  <Bar dataKey="earned" name="Earned" fill="#58C76D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* TRANSACTIONS & DETAILS */}
        <div className="flex flex-col lg:flex-row gap-8 relative">
          
          {/* Main Table Area */}
          <div className="flex-1 bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden flex flex-col min-h-[600px]">
            {/* Table Header/Filters */}
            <div className="p-4 border-b border-border flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-surface-secondary">
              <h3 className="font-bold text-heading text-lg shrink-0">Transaction History</h3>
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search by ID, desc..." 
                    className="w-full bg-background border border-border rounded-[var(--radius-input)] pl-9 pr-3 py-2 text-sm text-heading focus:outline-none focus:border-primary transition-colors"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <select 
                    className="appearance-none bg-background border border-border rounded-[var(--radius-input)] pl-8 pr-8 py-2 text-sm text-heading focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    <option value="Earned">Earned</option>
                    <option value="Spent">Spent</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Refunded">Refunded</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                  <FilterIcon className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    className="appearance-none bg-background border border-border rounded-[var(--radius-input)] pl-8 pr-8 py-2 text-sm text-heading focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Failed">Failed</option>
                    <option value="Disputed">Disputed</option>
                  </select>
                  <CheckCircle2 className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    className="appearance-none bg-background border border-border rounded-[var(--radius-input)] pl-8 pr-8 py-2 text-sm text-heading focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                  >
                    <option value="All">All Dates</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                  </select>
                  <Calendar className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    className="appearance-none bg-background border border-border rounded-[var(--radius-input)] pl-8 pr-8 py-2 text-sm text-heading focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="Newest">Newest First</option>
                    <option value="Oldest">Oldest First</option>
                    <option value="Highest Hours">Highest Hours</option>
                    <option value="Lowest Hours">Lowest Hours</option>
                  </select>
                  <ArrowUpDown className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-background text-xs uppercase tracking-wider text-muted font-semibold">
                    <th className="p-4 py-3 whitespace-nowrap">Date</th>
                    <th className="p-4 py-3 whitespace-nowrap">Type</th>
                    <th className="p-4 py-3">Description</th>
                    <th className="p-4 py-3 whitespace-nowrap">Exchange ID</th>
                    <th className="p-4 py-3 whitespace-nowrap text-right">Hours</th>
                    <th className="p-4 py-3 whitespace-nowrap text-right">Balance</th>
                    <th className="p-4 py-3 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map(tx => {
                    const typeCfg = TYPE_CONFIG[tx.type];
                    const Icon = typeCfg.icon;
                    const isSelected = selectedTx?.id === tx.id;
                    const isPositive = tx.amount > 0;
                    
                    return (
                      <tr 
                        key={tx.id} 
                        className={`hover:bg-surface-secondary cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                        onClick={() => setSelectedTx(tx)}
                      >
                        <td className="p-4 text-sm text-muted whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-4 text-sm whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${typeCfg.bg} ${typeCfg.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-heading">{tx.type}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-heading font-medium truncate max-w-[200px]">
                          {tx.description}
                        </td>
                        <td className="p-4 text-sm text-muted whitespace-nowrap">
                          {tx.exchangeId || "—"}
                        </td>
                        <td className="p-4 text-sm whitespace-nowrap text-right">
                          <span className={`font-bold ${isPositive ? 'text-success' : 'text-heading'}`}>
                            {isPositive ? '+' : ''}{tx.amount}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted whitespace-nowrap text-right font-medium">
                          {tx.balanceAfter}
                        </td>
                        <td className="p-4 text-sm whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_CONFIG[tx.status]}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTransactions.length === 0 && transactions.length > 0 && (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <div className="w-24 h-24 bg-surface-secondary border border-border rounded-full flex items-center justify-center mx-auto mb-6">
                          <SearchX className="w-10 h-10 text-muted" />
                        </div>
                        <h4 className="text-xl font-bold text-heading mb-2">No matches found</h4>
                        <p className="text-muted mb-6 max-w-sm mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
                      </td>
                    </tr>
                  )}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <div className="w-24 h-24 bg-surface-secondary border border-border rounded-full flex items-center justify-center mx-auto mb-6">
                          <History className="w-10 h-10 text-muted" />
                        </div>
                        <h4 className="text-xl font-bold text-heading mb-2">No transactions yet...</h4>
                        <p className="text-muted mb-6 max-w-sm mx-auto">Your Skill Hour Ledger is completely empty. Start exchanging skills to build your ledger and see your balances grow.</p>
                        <button className="px-6 py-2.5 bg-primary text-background font-bold rounded-[var(--radius-button)] shadow-[0_0_15px_rgba(88,199,109,0.3)] hover:bg-primary-hover transition-colors">
                          Browse Marketplace
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Side Panel */}
          {selectedTx && (
            <div className="lg:w-96 w-full shrink-0 bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle flex flex-col h-fit lg:sticky lg:top-8 animate-in slide-in-from-right-8 duration-300">
              <div className="p-5 border-b border-border flex items-center justify-between bg-surface-secondary rounded-t-[var(--radius-card)]">
                <h3 className="font-bold text-heading text-lg">Transaction Details</h3>
                <button onClick={() => setSelectedTx(null)} className="text-muted hover:text-heading p-1 rounded-md hover:bg-border transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                <div className="flex items-start gap-4 pb-6 border-b border-border">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${TYPE_CONFIG[selectedTx.type].bg} ${TYPE_CONFIG[selectedTx.type].color}`}>
                    <TYPE_CONFIG.Earned.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-heading">{selectedTx.amount > 0 ? '+' : ''}{selectedTx.amount} Skill Hours</h4>
                    <p className="text-muted font-medium mt-1">{selectedTx.type}</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Transaction ID</span>
                    <span className="text-heading font-mono">{selectedTx.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Date</span>
                    <span className="text-heading font-medium">{new Date(selectedTx.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[selectedTx.status]}`}>
                      {selectedTx.status}
                    </span>
                  </div>
                  
                  {selectedTx.exchangeId && (
                    <div className="flex justify-between">
                      <span className="text-muted">Exchange ID</span>
                      <span className="text-primary hover:underline cursor-pointer font-mono font-medium">{selectedTx.exchangeId}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <span className="text-muted text-xs font-bold uppercase tracking-wider block mb-2">Description</span>
                  <p className="text-heading text-sm font-medium leading-relaxed">{selectedTx.description}</p>
                </div>

                {selectedTx.linkedUserName && (
                  <div className="pt-4 border-t border-border">
                    <span className="text-muted text-xs font-bold uppercase tracking-wider block mb-3">Linked User</span>
                    <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-[var(--radius-card)]">
                      <div className="w-8 h-8 bg-surface-secondary border border-border rounded-full flex items-center justify-center font-bold text-xs text-heading">
                        {selectedTx.linkedUserName.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm text-heading">{selectedTx.linkedUserName}</span>
                      <button className="ml-auto text-xs text-primary font-medium hover:underline">View Profile</button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
                  <div className="bg-background border border-border p-3 rounded-[var(--radius-card)] text-center">
                    <span className="block text-xs text-muted font-medium mb-1">Balance Before</span>
                    <span className="text-lg font-bold text-heading">{selectedTx.balanceBefore}</span>
                  </div>
                  <div className="bg-background border border-border p-3 rounded-[var(--radius-card)] text-center">
                    <span className="block text-xs text-muted font-medium mb-1">Balance After</span>
                    <span className="text-lg font-bold text-primary">{selectedTx.balanceAfter}</span>
                  </div>
                </div>

                {selectedTx.notes && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-[var(--radius-card)]">
                    <span className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                      <FileText className="w-3.5 h-3.5" /> Notes
                    </span>
                    <p className="text-sm text-primary/80 leading-relaxed font-medium">
                      {selectedTx.notes}
                    </p>
                  </div>
                )}

              </div>
              
              <div className="p-5 border-t border-border bg-background rounded-b-[var(--radius-card)] space-y-3">
                {selectedTx.exchangeId && (
                  <button className="w-full py-2.5 bg-primary hover:bg-primary-hover text-background font-bold flex items-center justify-center gap-2 rounded-[var(--radius-button)] transition-all shadow-[0_0_15px_rgba(88,199,109,0.3)]">
                    View Exchange <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button className="w-full py-2.5 bg-surface border border-border hover:bg-surface-secondary text-heading font-semibold rounded-[var(--radius-button)] transition-all shadow-subtle">
                  Contact Support
                </button>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM ROWS: ACTIVE & PENDING / INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          
          <div className="space-y-8">
            {/* Active Reservations */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
              <div className="p-5 border-b border-border bg-surface-secondary">
                <h3 className="font-bold text-heading flex items-center gap-2">
                  <Lock className="w-4 h-4 text-warning" /> Active Reservations
                </h3>
              </div>
              <div className="p-0">
                {activeReservations.length > 0 ? (
                  <div className="divide-y divide-border">
                    {activeReservations.map(tx => (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-background transition-colors">
                        <div>
                          <h4 className="font-medium text-sm text-heading">{tx.description}</h4>
                          <p className="text-xs text-muted mt-1">With {tx.linkedUserName}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-warning text-sm">{Math.abs(tx.amount)} Hours</span>
                          <p className="text-[10px] uppercase font-bold text-muted tracking-wider mt-1">In Progress</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted text-sm">No active reservations.</div>
                )}
              </div>
            </div>

            {/* Pending Releases */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
              <div className="p-5 border-b border-border bg-surface-secondary">
                <h3 className="font-bold text-heading flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Pending Releases
                </h3>
              </div>
              <div className="p-0">
                {pendingReleases.length > 0 ? (
                  <div className="divide-y divide-border">
                    {pendingReleases.map(tx => (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-background transition-colors">
                        <div>
                          <h4 className="font-medium text-sm text-heading">{tx.description}</h4>
                          <p className="text-xs text-muted mt-1">Waiting for {tx.linkedUserName}'s confirmation</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-heading text-sm">+{Math.abs(tx.amount)} Hours</span>
                          <p className="text-[10px] uppercase font-bold text-primary tracking-wider mt-1">Expected Today</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted text-sm">No pending releases.</div>
                )}
              </div>
            </div>

            {/* Ledger Integrity */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
              <div className="p-5 border-b border-border bg-surface-secondary">
                <h3 className="font-bold text-heading flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" /> Ledger Integrity
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-heading">Status: Verified</h4>
                    <p className="text-xs text-muted">All hashes match. Blockchain integrity maintained.</p>
                  </div>
                </div>
                <p className="text-sm text-body leading-relaxed mt-4">
                  Every Skill Hour transaction is permanently recorded and cannot be edited or deleted by members. 
                  Administrative corrections are separately logged to preserve a complete, undeniable audit trail.
                  If Weave is trust, this ledger is the proof.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Monthly Report */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
              <div className="p-5 border-b border-border bg-surface-secondary flex items-center justify-between">
                <h3 className="font-bold text-heading flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Monthly Report
                </h3>
                <button className="text-primary hover:text-primary-hover font-medium text-sm flex items-center gap-1 hover:underline">
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                <div>
                  <span className="block text-muted text-xs mb-1 uppercase tracking-wider font-medium">Hours Earned</span>
                  <span className="font-bold text-heading text-lg">+{stats.earned30Days}</span>
                </div>
                <div>
                  <span className="block text-muted text-xs mb-1 uppercase tracking-wider font-medium">Hours Spent</span>
                  <span className="font-bold text-heading text-lg">-{stats.spent30Days}</span>
                </div>
                <div>
                  <span className="block text-muted text-xs mb-1 uppercase tracking-wider font-medium">Net Balance</span>
                  <span className={`font-bold text-lg ${stats.netChange30Days >= 0 ? 'text-success' : 'text-error'}`}>
                    {stats.netChange30Days > 0 ? '+' : ''}{stats.netChange30Days}
                  </span>
                </div>
                <div>
                  <span className="block text-muted text-xs mb-1 uppercase tracking-wider font-medium">Exchanges</span>
                  <span className="font-bold text-heading text-lg">{stats.completedExchanges30Days}</span>
                </div>
                <div>
                  <span className="block text-muted text-xs mb-1 uppercase tracking-wider font-medium">Trust Score</span>
                  <span className={`font-bold text-lg flex items-center gap-1 ${stats.trustScoreChange30Days >= 0 ? 'text-success' : 'text-error'}`}>
                    <TrendingUp className={`w-4 h-4 ${stats.trustScoreChange30Days < 0 ? 'rotate-180' : ''}`} /> 
                    {stats.trustScoreChange30Days > 0 ? '+' : ''}{stats.trustScoreChange30Days} pts
                  </span>
                </div>
                <div>
                  <span className="block text-muted text-xs mb-1 uppercase tracking-wider font-medium">Ratings</span>
                  <span className="font-bold text-heading text-lg">{stats.ratingsReceived30Days} Received</span>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="bg-surface border border-border rounded-[var(--radius-card)] shadow-subtle overflow-hidden">
              <div className="p-5 border-b border-border bg-surface-secondary">
                <h3 className="font-bold text-heading text-sm uppercase tracking-wider">Transaction Legend</h3>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 text-xs">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-success"></div> <span className="text-muted font-medium uppercase tracking-wider">Earned</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-error"></div> <span className="text-muted font-medium uppercase tracking-wider">Spent</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-warning"></div> <span className="text-muted font-medium uppercase tracking-wider">Reserved</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary"></div> <span className="text-muted font-medium uppercase tracking-wider">Refunded</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-border"></div> <span className="text-muted font-medium uppercase tracking-wider">Pending</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div> <span className="text-muted font-medium uppercase tracking-wider">Adjustment</span></div>
              </div>
            </div>

            {/* Insights & Milestones */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle">
                <span className="text-muted text-xs font-medium mb-1 block uppercase tracking-wider">Most Active Skill</span>
                <div className="text-heading font-bold mb-1 line-clamp-1">{insights.mostActiveSkill}</div>
                <div className="text-primary text-sm font-medium">{insights.mostActiveSkillHours} Hours Earned</div>
              </div>
              <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle">
                <span className="text-muted text-xs font-medium mb-1 block uppercase tracking-wider">Top Partner</span>
                <div className="text-heading font-bold flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-[10px] uppercase shrink-0">
                    {insights.topPartnerName !== "N/A" ? insights.topPartnerName.charAt(0) : "?"}
                  </div>
                  <span className="line-clamp-1">{insights.topPartnerName}</span>
                </div>
                <div className="text-muted text-sm font-medium">{insights.topPartnerExchanges} Exchanges</div>
              </div>
              <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle">
                <span className="text-muted text-xs font-medium mb-1 block uppercase tracking-wider">Avg Exchange</span>
                <div className="text-heading font-bold text-xl">{insights.avgExchangeHours} Hours</div>
              </div>
              <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle">
                <span className="text-muted text-xs font-medium mb-1 block uppercase tracking-wider">Largest</span>
                <div className="text-heading font-bold text-xl">{insights.largestExchange} Hours</div>
              </div>
              <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle bg-gradient-to-br from-orange-500/5 to-transparent">
                <span className="text-orange-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 shrink-0" /> Current Streak
                </span>
                <div className="text-heading font-bold text-xl">
                  {insights.currentStreak} Weeks
                </div>
              </div>
              <div className="bg-surface border border-border p-5 rounded-[var(--radius-card)] shadow-subtle bg-gradient-to-br from-primary/5 to-transparent">
                <span className="text-primary font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 shrink-0" /> Recent Milestone
                </span>
                <div className="text-heading font-bold text-sm leading-tight">
                  {insights.recentMilestone || "Keep completing exchanges!"}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
