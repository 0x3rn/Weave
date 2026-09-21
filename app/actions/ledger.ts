"use server";

import { getCurrentUserId } from "./user";
import { LedgerTransaction } from "@/types";
import { iso, payload, sql } from "@/lib/neon";
import { getUserById } from "@/lib/users";

export async function getLedgerData() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const userData = await getUserById(userId);
  if (!userData) throw new Error("User not found");
  const [rows, pendingRows] = await Promise.all([sql.query(
    `select le.*, e.status as exchange_status,
      related.full_name as related_user_name, related.username as related_username, related.photo_url as related_user_avatar,
      latest.requested_entry->>'entry_status' as requested_status
    from ledger_entries le
    left join exchanges e on e.id=le.exchange_id
    left join users related on related.id=le.related_user_id
    left join lateral (
      select requested_entry from ledger_entry_events where ledger_entry_id=le.id order by occurred_at desc,id desc limit 1
    ) latest on true
    where le.user_id=$1 order by le.occurred_at desc`,
    [userId],
  ), sql.query(
    `select e.id,e.title,e.requester_id,e.provider_id,e.requester_escrow_hours,e.provider_escrow_hours, requester.full_name as requester_name,provider.full_name as provider_name from exchanges e join users requester on requester.id=e.requester_id join users provider on provider.id=e.provider_id where e.status='in_review' and $1 in(e.requester_id,e.provider_id)`,
    [userId],
  )]);
  const terminalStatuses = new Set(["completed", "cancelled"]);
  const transactions = rows.map(row => {
    const rawType = String(row.entry_type ?? "Adjustment");
    const type = rawType === "admin_credit" || rawType === "admin_debit" ? "Admin Correction" : rawType;
    const exchangeStatus = String(row.exchange_status ?? "");
    let status = String(row.requested_status ?? row.entry_status ?? "Completed");
    if (rawType === "Reserved" && status === "Active" && terminalStatuses.has(exchangeStatus)) {
      status = exchangeStatus === "cancelled" ? "Cancelled" : "Completed";
    } else if (rawType === "Reserved" && status === "Active" && exchangeStatus === "disputed") {
      status = "Disputed";
    }
    return {
      ...payload<Record<string, unknown>>(row.payload),
      id: String(row.id), userId: String(row.user_id ?? ""), exchangeId: row.exchange_id ? String(row.exchange_id) : undefined,
      linkedUserId: row.related_user_id ? String(row.related_user_id) : undefined,
      linkedUserName: row.related_user_name ? String(row.related_user_name) : row.related_username ? String(row.related_username) : undefined,
      linkedUserAvatar: row.related_user_avatar ? String(row.related_user_avatar) : undefined,
      type: type as LedgerTransaction["type"], status: status as LedgerTransaction["status"], amount: Number(row.amount ?? 0), balanceBefore: Number(row.balance_before ?? 0),
      balanceAfter: Number(row.balance_after ?? 0), description: String(row.description ?? ""), notes: row.notes ? String(row.notes) : undefined, date: iso(row.occurred_at),
    };
  }) as LedgerTransaction[];

  const pendingReleases = pendingRows.map(row => {
    const isProvider = String(row.provider_id) === userId;
    const amount = Number(isProvider ? row.requester_escrow_hours : row.provider_escrow_hours) || 0;
    return {
      id: `pending-release-${String(row.id)}`, userId, date: new Date().toISOString(), type: "Released" as const,
      description: `Pending release: ${String(row.title)}`, exchangeId: String(row.id), amount,
      balanceBefore: userData.skillHours || 0, balanceAfter: (userData.skillHours || 0) + amount, status: "Pending" as const,
      linkedUserId: isProvider ? String(row.requester_id) : String(row.provider_id),
      linkedUserName: isProvider ? String(row.requester_name ?? "Partner") : String(row.provider_name ?? "Partner"),
      notes: "Waiting for all required review decisions before Skill Hours are released.",
    };
  }).filter(tx => tx.amount > 0);
  // 3. Compute Stats & Insights
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let earned30Days = 0;
  let spent30Days = 0;
  let reservedBalance = 0;
  
  let totalExchangeHours = 0;
  let exchangeCount = 0;
  let largestExchange = 0;
  
  // Streak calculation variables
  let currentStreak = 0;
  let lastTransactionDate: Date | null = null;

  const partnerCounts: Record<string, { name: string, count: number }> = {};
  const descriptionHours: Record<string, number> = {};

  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    
    // Calculate balances based on status and type
    if (tx.status === "Active" && tx.type === "Reserved") {
      reservedBalance += Math.abs(tx.amount);
    }

    // Calculate 30 day metrics
    if (txDate >= thirtyDaysAgo && tx.status === "Completed") {
      if (tx.amount > 0) {
        earned30Days += tx.amount;
      } else if (tx.amount < 0) {
        spent30Days += Math.abs(tx.amount);
      }
    }
    
    // Insights Calculations
    if (tx.status === "Completed" && (tx.type === "Earned" || tx.type === "Spent")) {
      const absAmount = Math.abs(tx.amount);
      totalExchangeHours += absAmount;
      exchangeCount++;
      
      if (absAmount > largestExchange) {
        largestExchange = absAmount;
      }
      
      if (tx.linkedUserId && tx.linkedUserName) {
        if (!partnerCounts[tx.linkedUserId]) {
          partnerCounts[tx.linkedUserId] = { name: tx.linkedUserName, count: 0 };
        }
        partnerCounts[tx.linkedUserId].count++;
      }
      
      if (tx.type === "Earned") {
        if (!descriptionHours[tx.description]) {
          descriptionHours[tx.description] = 0;
        }
        descriptionHours[tx.description] += tx.amount;
      }
    }

    // Streak calculation (consecutive weeks with a completed transaction)
    if (tx.status === "Completed") {
      if (!lastTransactionDate) {
        lastTransactionDate = txDate;
        currentStreak = 1;
      } else {
        const weeksDiff = (lastTransactionDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
        if (weeksDiff <= 1.5) {
          // If within roughly a week, continue streak
          currentStreak++;
          lastTransactionDate = txDate;
        } else if (weeksDiff > 1.5 && currentStreak > 0) {
          // Streak broken, but we only care about the current one, so we don't reset if we are looking backwards
          // Actually, since transactions are sorted newest first, if the gap from 'now' to first tx is large, streak is 0
        }
      }
    }
  }

  // Verify if current streak is still active
  if (lastTransactionDate) {
    const weeksSinceLastTx = (now.getTime() - lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
    if (weeksSinceLastTx > 2) {
      currentStreak = 0;
    }
  }

  let topPartnerName = "N/A";
  let topPartnerExchanges = 0;
  Object.values(partnerCounts).forEach(p => {
    if (p.count > topPartnerExchanges) {
      topPartnerExchanges = p.count;
      topPartnerName = p.name;
    }
  });

  let mostActiveSkill = "N/A";
  let mostActiveSkillHours = 0;
  Object.entries(descriptionHours).forEach(([desc, hours]) => {
    if (hours > mostActiveSkillHours) {
      mostActiveSkillHours = hours;
      mostActiveSkill = desc;
    }
  });

  const avgExchangeHours = exchangeCount > 0 ? (totalExchangeHours / exchangeCount) : 0;
  
  const recentBonusTx = transactions.find(tx => tx.type === "Bonus" || tx.type === "Welcome Credit");
  const recentMilestone = recentBonusTx ? recentBonusTx.description : null;

  const stats = {
    currentBalance: userData?.skillHours || 0,
    reservedBalance,
    pendingBalance: pendingReleases.reduce((total, tx) => total + tx.amount, 0),
    lifetimeEarned: transactions.filter(tx => tx.status === "Completed" && ["Earned", "Bonus", "Welcome Credit"].includes(tx.type)).reduce((total, tx) => total + Math.max(tx.amount, 0), 0),
    lifetimeSpent: transactions.filter(tx => tx.status === "Completed" && tx.type === "Reserved").reduce((total, tx) => total + Math.abs(tx.amount), 0),
    earned30Days,
    spent30Days,
    netChange30Days: earned30Days - spent30Days,
    completedExchanges30Days: new Set(transactions.filter(tx => new Date(tx.date) >= thirtyDaysAgo && tx.status === "Completed" && tx.exchangeId && (tx.type === "Earned" || tx.type === "Spent")).map(tx => tx.exchangeId)).size,
    trustScoreChange30Days: Number((userData.stats as unknown as Record<string, unknown>)?.trustScoreChange30Days || 0),
    ratingsReceived30Days: Number((userData.stats as unknown as Record<string, unknown>)?.reviewsCount30Days || 0)
  };

  const insights = {
    mostActiveSkill,
    mostActiveSkillHours,
    topPartnerName,
    topPartnerExchanges,
    avgExchangeHours: parseFloat(avgExchangeHours.toFixed(1)),
    largestExchange,
    currentStreak,
    recentMilestone
  };

  // 4. Generate Chart Data
  const generateDaysChart = (days: number) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayTx = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getDate() === d.getDate() && txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear() && tx.status === "Completed";
      });

      let earned = 0;
      let spent = 0;
      dayTx.forEach(tx => {
        if (tx.amount > 0) earned += tx.amount;
        if (tx.amount < 0) spent += Math.abs(tx.amount);
      });

      data.push({ name: dayStr, earned, spent });
    }
    return data;
  };

  const chartData7Days = generateDaysChart(7);
  const chartData30Days = generateDaysChart(30);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const generateMonthsChart = (monthsCount: number) => {
    const data = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      
      const monthTx = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear() && tx.status === "Completed";
      });

      let earned = 0;
      let spent = 0;
      monthTx.forEach(tx => {
        if (tx.amount > 0) earned += tx.amount;
        if (tx.amount < 0) spent += Math.abs(tx.amount);
      });

      data.push({ name: monthName, earned, spent });
    }
    return data;
  };

  const chartData6Months = generateMonthsChart(6);
  const chartData1Year = generateMonthsChart(12);
  const chartDataThisYear = generateMonthsChart(now.getMonth() + 1);

  // Generate All Time (by Year)
  const chartDataAllTime = [];
  if (transactions.length > 0) {
    const oldestTx = new Date(transactions[transactions.length - 1].date);
    const oldestYear = oldestTx.getFullYear();
    const currentYear = now.getFullYear();

    for (let y = oldestYear; y <= currentYear; y++) {
      const yearTx = transactions.filter(tx => {
        return new Date(tx.date).getFullYear() === y && tx.status === "Completed";
      });

      let earned = 0;
      let spent = 0;
      yearTx.forEach(tx => {
        if (tx.amount > 0) earned += tx.amount;
        if (tx.amount < 0) spent += Math.abs(tx.amount);
      });

      chartDataAllTime.push({ name: y.toString(), earned, spent });
    }
  } else {
    chartDataAllTime.push({ name: now.getFullYear().toString(), earned: 0, spent: 0 });
  }

  return {
    transactions,
    pendingReleases,
    stats,
    insights,
    chartData7Days,
    chartData30Days,
    chartData6Months,
    chartData1Year,
    chartDataThisYear,
    chartDataAllTime
  };
}
