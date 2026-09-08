"use server";

import { getUserById } from "@/lib/users";
import { getCurrentUserId } from "../user";

export async function requireAdminUser() {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Unauthorized");
  const user = await getUserById(uid);
  if (!user?.isAdmin && user?.role !== "Admin") throw new Error("Forbidden");

  return uid;
}
