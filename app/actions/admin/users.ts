"use server";

import { db } from "@/lib/firebase-admin";

export async function getAdminUsersDashboard() {
  if (!db) {
    return { error: "Database connection not initialized" };
  }

  try {
    // We fetch all users for the admin dashboard. In a massive scale app, this would be paginated,
    // but for our early stage community ops dashboard, fetching all is ideal for instant filtering.
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    
    const users = await Promise.all(snapshot.docs.map(async (doc) => {
      const userData = doc.data();
      
      // Determine if they have a portfolio for dynamic completeness calculation
      const portSnap = await db!.collection("users").doc(doc.id).collection("portfolio").limit(1).get();
      
      return {
        uid: doc.id,
        ...userData,
        hasPortfolio: !portSnap.empty
      };
    }));

    // Calculate Dashboard Summary Metrics
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalUsers = users.length;
    let verifiedCount = 0;
    let newTodayCount = 0;
    let activeTodayCount = 0;
    let suspendedCount = 0;
    let reportedCount = 0;
    let thisWeekCount = 0;

    users.forEach((user: any) => {
      if (user.isVerified) verifiedCount++;
      
      const createdAt = new Date(user.createdAt);
      if (createdAt.toISOString().split('T')[0] === todayStr) {
        newTodayCount++;
      }
      if (createdAt > lastWeek) {
        thisWeekCount++;
      }

      if (user.lastActive && user.lastActive.startsWith(todayStr)) {
        activeTodayCount++;
      }

      if (user.status === "suspended") {
        suspendedCount++;
      }

      if (user.stats?.reportsAgainst > 0) {
        reportedCount++;
      }
    });

    // Also fetch counts from other collections for the dashboard
    const invitesSnap = await db.collection("invite_applications").where("status", "==", "pending").count().get();
    const pendingInvites = invitesSnap.data().count;

    // For now we don't have a strict 'pending_verification' table mapped, so we'll approximate 0 or calculate later
    const pendingVerification = 0;

    return {
      users,
      summary: {
        totalUsers,
        thisWeekCount,
        activeTodayCount,
        activePercentage: totalUsers > 0 ? Math.round((activeTodayCount / totalUsers) * 100) : 0,
        verifiedCount,
        verifiedPercentage: totalUsers > 0 ? Math.round((verifiedCount / totalUsers) * 100) : 0,
        pendingInvites,
        pendingVerification,
        suspendedCount,
        reportedCount,
        newTodayCount
      }
    };
  } catch (error: any) {
    console.error("Error fetching admin users:", error);
    return { error: error.message };
  }
}

export async function updateUserStatus(uid: string, status: "active" | "suspended" | "banned") {
  if (!db) return { error: "Database not initialized" };
  try {
    await db.collection("users").doc(uid).update({ status });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateUserVerification(uid: string, isVerified: boolean) {
  if (!db) return { error: "Database not initialized" };
  try {
    await db.collection("users").doc(uid).update({ isVerified });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function saveAdminUserNotes(uid: string, notes: string) {
  if (!db) return { error: "Database not initialized" };
  try {
    await db.collection("users").doc(uid).update({ adminNotes: notes });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function adjustUserSkillHours(uid: string, amount: number, reason: string) {
  if (!db) return { error: "Database not initialized" };
  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return { error: "User not found" };
    
    const currentHours = userDoc.data()?.skillHours || 0;
    const newBalance = currentHours + amount;

    await db.runTransaction(async (transaction) => {
      // 1. Update user balance
      transaction.update(userRef, { skillHours: newBalance });
      
      // 2. Create a ledger entry to maintain a paper trail
      const ledgerRef = db!.collection("skill_ledger").doc();
      transaction.set(ledgerRef, {
        userId: uid,
        amount: amount,
        type: amount > 0 ? "admin_credit" : "admin_debit",
        description: reason,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString()
      });
    });

    return { success: true, newBalance };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteUserAccount(uid: string) {
  if (!db) return { error: "Database not initialized" };
  try {
    // Delete from Firestore (Auth deletion would normally require admin SDK auth functions)
    await db.collection("users").doc(uid).delete();
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
