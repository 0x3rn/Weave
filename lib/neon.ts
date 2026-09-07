import "server-only";

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

export const sql = neon(databaseUrl);

export function payload<T extends object>(value: unknown): T {
  return value && typeof value === "object" && !Array.isArray(value) ? value as T : {} as T;
}

export function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : typeof value === "string" ? value : "";
}
