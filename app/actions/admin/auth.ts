"use server";

import { adminSession } from "@/lib/admin-ops-access";

export async function requireAdminUser() {
  return (await adminSession("legacy.manage")).uid;
}
