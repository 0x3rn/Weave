"use server";

import { db } from "@/lib/firebase-admin";
import { getCurrentUserId } from "../user";

export async function requireAdminUser() {
  const uid = await getCurrentUserId();
  if (!uid || !db) throw new Error("Unauthorized");

  const user = await db.collection("users").doc(uid).get();
  const data = user.data();
  if (!data?.isAdmin && data?.role !== "Admin") throw new Error("Forbidden");

  return uid;
}
