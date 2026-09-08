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
  const rows = await sql.query("select * from ledger_entries where user_id=$1 order by occurred_at desc", [userId]);
  const transactions = rows.map(row => ({
    ...payload<Record<string, unknown>>(row.payload),
    id: String(row.id), userId: String(row.user_id ?? ""), exchangeId: row.exchange_id ? String(row.exchange_id) : undefined,
    linkedUserId: row.related_user_id ? String(row.related_user_id) : undefined, type: String(row.entry_type ?? "Adjustment") as LedgerTransaction["type"],
    status: String(row.entry_status ?? "Completed") as LedgerTransaction["status"], amount: Number(row.amount ?? 0), balanceBefore: Number(row.balance_before ?? 0),
    balanceAfter: Number(row.balance_after ?? 0), description: String(row.description ?? ""), notes: row.notes ? String(row.notes) : undefined, date: iso(row.occurred_at),
  })) as LedgerTransaction[];

  // 3. Compute Stats & Insights
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let earned30Days = 0;
  let spent30Days = 0;
  let reservedBalance = 0;
  let pendingBalance = 0;
  
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
    if (tx.status === "Pending") {
      pendingBalance += Math.abs(tx.amount); // Simplification
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
    pendingBalance,
    lifetimeEarned: userData?.stats?.skillHoursEarned || 0,
    lifetimeSpent: userData?.stats?.skillHoursSpent || 0,
    earned30Days,
    spent30Days,
    netChange30Days: earned30Days - spent30Days,
    completedExchanges30Days: transactions.filter(tx => 
      new Date(tx.date) >= thirtyDaysAgo && 
      tx.status === "Completed" && 
      tx.exchangeId && 
      (tx.type === "Earned" || tx.type === "Spent")
    ).length,
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
