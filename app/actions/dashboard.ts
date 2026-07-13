"use server";

import { db } from "@/lib/firebase-admin";
import { getCurrentUserId } from "./user";
import { User, Exchange, ExchangeRequest, SkillLedgerEntry, Notification } from "@/types";
import { calculateProfileCompletion, calculateTrustScore } from "@/lib/user-metrics";

export async function getDashboardData() {
  if (!db) {
    throw new Error("Firestore not initialized");
  }

  const uid = await getCurrentUserId();
  if (!uid) {
    throw new Error("Unauthorized");
  }

  try {
    // 1. Fetch User Data
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new Error("User not found");
    }
    
    // Check if user has portfolio for completeness
    const portSnap = await db.collection("users").doc(uid).collection("portfolio").limit(1).get();
    
    const user = {
      uid: userDoc.id,
      ...userDoc.data(),
      hasPortfolio: !portSnap.empty
    } as unknown as User;

    // Calculate dynamic stats
    const profileCompletion = calculateProfileCompletion(user);
    const trustScore = calculateTrustScore(user, profileCompletion);
    
    // Override user object with computed values for the dashboard
    user.profileCompletion = profileCompletion;
    user.trustScore = trustScore;
    user.stats = user.stats || {
      rating: 0,
      reviewsCount: 0,
      exchangesCompleted: 0,
      skillHoursEarned: 0,
      skillHoursSpent: 0,
      completionRate: 0,
      responseTimeHours: 0,
      repeatCollaborations: 0,
    };

    // 2. Fetch Active Exchanges (where user is participant and status is pending or in_progress)
    // Firestore requires an index for array-contains with multiple where clauses, 
    // so we might need to fetch all for user and filter in memory if the index isn't built.
    // For now, let's fetch all where user is participant and filter in memory to be safe against missing indexes.
    const exchangesSnap = await db.collection("exchanges")
      .where("participants", "array-contains", uid)
      .get();
      
    const allExchanges = exchangesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exchange));
    const activeExchanges = allExchanges.filter(ex => ex.status === "in_progress" || ex.status === "pending_proposal");

    // 3. Fetch My Requests (Sent or Received)
    const requestsSentSnap = await db.collection("exchange_requests").where("senderId", "==", uid).get();
    const requestsReceivedSnap = await db.collection("exchange_requests").where("receiverId", "==", uid).get();
    
    const myRequests = [
      ...requestsSentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExchangeRequest)),
      ...requestsReceivedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExchangeRequest))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pendingRequestsCount = myRequests.filter(req => req.status === "pending" || req.status === "reviewing").length;

    // 4. Fetch Ledger Snapshot
    const ledgerSnap = await db.collection("skill_ledger")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();
      
    const ledgerSnapshot = ledgerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SkillLedgerEntry));

    // 5. Fetch Notifications
    const notifSnap = await db.collection("notifications")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
      
    const notifications = notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));

    // 6. Fetch Marketplace Matches
    // We look for users who offer what the current user is looking for.
    let matches: User[] = [];
    if (user.skillsLookingFor && user.skillsLookingFor.length > 0) {
      // In a real app, this needs a sophisticated recommendation engine (e.g. Algolia/Typesense)
      // For now, we do a basic query matching at least the first skill looking for
      const firstSkill = user.skillsLookingFor[0];
      const matchSnap = await db.collection("users")
        .where("skillsOffered", "array-contains", firstSkill)
        .where("status", "==", "active")
        .limit(5)
        .get();
        
      matches = matchSnap.docs
        .filter(doc => doc.id !== uid) // exclude self
        .map(doc => {
          const data = doc.data();
          return { uid: doc.id, ...data } as User;
        });
    }

    // 7. Compute Tasks & Reminders
    const tasks: { id: string; title: string; actionText: string; actionUrl: string; isUrgent: boolean }[] = [];
    
    if (profileCompletion < 100) {
      tasks.push({
        id: "complete_profile",
        title: `Complete your profile (${profileCompletion}% done)`,
        actionText: "Edit Profile",
        actionUrl: "/profile",
        isUrgent: profileCompletion < 50
      });
    }

    if (!user.isVerified) {
      tasks.push({
        id: "get_verified",
        title: "Become verified to earn Trust points",
        actionText: "Start Verification",
        actionUrl: "/verification",
        isUrgent: false
      });
    }

    const receivedPending = myRequests.filter(req => req.receiverId === uid && req.status === "pending");
    if (receivedPending.length > 0) {
      tasks.push({
        id: "pending_requests",
        title: `You have ${receivedPending.length} new collaboration request(s)`,
        actionText: "Review",
        actionUrl: "/requests",
        isUrgent: true
      });
    }

    const unreadNotifs = notifications.filter(n => !n.isRead);
    if (unreadNotifs.length > 0) {
      tasks.push({
        id: "unread_notifications",
        title: `You have ${unreadNotifs.length} unread notification(s)`,
        actionText: "View All",
        actionUrl: "/notifications",
        isUrgent: false
      });
    }

    return {
      user,
      activeExchanges,
      myRequests,
      pendingRequestsCount,
      ledgerSnapshot,
      notifications,
      matches,
      tasks
    };

  } catch (error: any) {
    console.error("Failed to fetch dashboard data:", error);
    throw new Error(error.message || "Failed to load dashboard");
  }
}
