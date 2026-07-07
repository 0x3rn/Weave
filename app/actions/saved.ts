"use server";

import { db } from "@/lib/firebase-admin";
import { getCurrentUserId } from "./user";

export async function toggleSavedItem(targetId: string, type: "professional" | "request") {
  const userId = await getCurrentUserId();
  if (!userId || !db) return { success: false, error: "Unauthorized" };

  try {
    const docRef = db.collection("users").doc(userId).collection("saved").doc(targetId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      await docRef.delete();
      return { success: true, saved: false };
    } else {
      await docRef.set({ type, savedAt: new Date().toISOString() });
      return { success: true, saved: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSavedItemIds() {
  const userId = await getCurrentUserId();
  if (!userId || !db) return [];

  try {
    const snapshot = await db.collection("users").doc(userId).collection("saved").get();
    return snapshot.docs.map(doc => ({ id: doc.id, type: doc.data().type }));
  } catch (e) {
    return [];
  }
}
