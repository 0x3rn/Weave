"use server";

import { db } from "@/lib/firebase-admin";
import { Notification } from "@/types";
import { getCurrentUserId } from "./user";
import { NotificationPreferences } from "@/types";

export async function getNotifications() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized", notifications: [] };
    if (!db) throw new Error("Database not initialized");
    
    const snapshot = await db.collection("notifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
      
    return {
      success: true,
      notifications: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Notification)
    };
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: error.message, notifications: [] };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) throw new Error("Database not initialized");

    const notifRef = db.collection("notifications").doc(notificationId);
    const doc = await notifRef.get();
    
    if (!doc.exists || doc.data()?.userId !== userId) {
      return { success: false, error: "Notification not found or unauthorized" };
    }

    await notifRef.update({ isRead: true });
    return { success: true };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
}

export async function getUnreadNotificationsCount() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized", count: 0 };
    if (!db) throw new Error("Database not initialized");
    
    const snapshot = await db.collection("notifications")
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .count()
      .get();
      
    return {
      success: true,
      count: snapshot.data().count
    };
  } catch (error: any) {
    console.error("Error fetching unread notifications count:", error);
    return { success: false, error: error.message, count: 0 };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const unreadSnap = await db.collection("notifications")
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .get();

    const batch = db.batch();
    unreadSnap.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
    return { success: true, count: unreadSnap.size };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkUpdateNotifications(notificationIds: string[], updates: { isRead?: boolean; isArchived?: boolean }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const batch = db.batch();
    for (const id of notificationIds) {
      const ref = db.collection("notifications").doc(id);
      batch.update(ref, updates);
    }

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkDeleteNotifications(notificationIds: string[]) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    const batch = db.batch();
    for (const id of notificationIds) {
      const ref = db.collection("notifications").doc(id);
      batch.delete(ref);
    }

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateNotificationPreferences(preferences: NotificationPreferences) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (!db) return { success: false, error: "Database not initialized" };

    if (!preferences.security) {
      preferences.security = true;
    }

    await db.collection("users").doc(userId).update({
      notificationPreferences: preferences
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
