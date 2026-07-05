"use server";

import { db } from "@/lib/firebase-admin";
import { Notification } from "@/types";

export async function getNotifications(userId: string) {
  try {
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
    if (!db) throw new Error("Database not initialized");
    await db.collection("notifications").doc(notificationId).update({
      isRead: true
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
}

export async function getUnreadNotificationsCount(userId: string) {
  try {
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
