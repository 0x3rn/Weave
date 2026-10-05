import type { User } from "@/types";
export function adminTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}
export function adminDate(value: string | Date, timeZone = "UTC") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}
export function summarizeAdminUsers(
  users: User[],
  pendingInvites: number,
  timeZone = "UTC",
  now = new Date(),
) {
  const today = adminDate(now, timeZone),
    weekStart = now.getTime() - 7 * 86_400_000;
  const totalUsers = users.length;
  const verifiedCount = users.filter(
    (u) => u.isVerified && u.status !== "deleted",
  ).length;
  const activeTodayCount = users.filter(
    (u) => u.status === "active" && adminDate(u.lastActive, timeZone) === today,
  ).length;
  return {
    totalUsers,
    verifiedCount,
    activeTodayCount,
    verifiedPercentage: totalUsers
      ? Math.round((verifiedCount / totalUsers) * 100)
      : 0,
    activePercentage: totalUsers
      ? Math.round((activeTodayCount / totalUsers) * 100)
      : 0,
    thisWeekCount: users.filter(
      (u) =>
        new Date(u.createdAt).getTime() >= weekStart &&
        new Date(u.createdAt).getTime() <= now.getTime(),
    ).length,
    newTodayCount: users.filter(
      (u) => adminDate(u.createdAt, timeZone) === today,
    ).length,
    suspendedCount: users.filter((u) => u.status === "suspended").length,
    reportedCount: users.filter((u) => Number(u.stats?.reportsAgainst || 0) > 0)
      .length,
    unverifiedCount: users.filter((u) => !u.isVerified && u.status === "active")
      .length,
    pendingInvites,
  };
}
