"use server";

import { createFirebaseUser, deleteFirebaseUser, getFirebaseUserByEmail } from "@/lib/firebase-auth-server";
import { iso, payload, sql } from "@/lib/neon";

export async function getInviteDetails(code: string) {
  if (!code || code.length > 200) return null;
  try {
    const [invite] = await sql.query("select email,status,expires_at,payload from invites where code=$1 limit 1", [code]);
    if (!invite) return null;
    const data = payload<Record<string, unknown>>(invite.payload);
    return { email: invite.email ?? data.email, status: invite.status ?? data.status, expiresAt: iso(invite.expires_at ?? data.expiresAt) };
  } catch {
    return null;
  }
}

export async function registerWithInvite(code: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!code || code.length > 200 || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || password.length < 8 || password.length > 128) return { error: "Invalid registration details" };

  let createdUid: string | null = null;
  try {
    const [invite] = await sql.query("select * from invites where code=$1 limit 1", [code]);
    if (!invite) return { error: "Invalid invite code" };
    const inviteData = payload<Record<string, unknown>>(invite.payload);
    const status = String(invite.status ?? inviteData.status ?? "");
    if (status === "used") return { error: "This invitation has already been used" };
    if (status === "revoked") return { error: "This invitation is no longer valid" };
    const expiresAt = iso(invite.expires_at ?? inviteData.expiresAt);
    if (expiresAt && Date.now() > new Date(expiresAt).getTime()) return { error: "This invitation has expired" };
    if (String(invite.email ?? inviteData.email ?? "").toLowerCase() !== normalizedEmail) return { error: "This invitation was issued for another email address" };

    const existingUser = await getFirebaseUserByEmail(normalizedEmail);
    if (existingUser) {
      return { error: "An account with this email already exists" };
    }

    let application: Record<string, unknown> = {};
    const applicationId = typeof inviteData.inviteApplicationId === "string" ? inviteData.inviteApplicationId : null;
    if (applicationId) {
      const [row] = await sql.query("select payload from invite_applications where id=$1", [applicationId]);
      if (row) application = payload<Record<string, unknown>>(row.payload);
    }
    const settings = payload<Record<string, unknown>>(application.approvedSettings);
    const startingHours = Number.isFinite(Number(settings.startingHours)) ? Math.max(0, Math.min(10_000, Number(settings.startingHours))) : 5;
    const isVerified = settings.badge === true;

    const authUser = await createFirebaseUser({ email: normalizedEmail, password, emailVerified: true });
    createdUid = authUser.uid;
    const now = new Date().toISOString();
    const userPayload = {
      email: normalizedEmail,
      createdAt: now,
      skillHours: startingHours,
      isVerified,
      source: "invite_code",
      fullName: application.fullName ?? null,
      country: application.country ?? null,
      timeZone: application.timeZone ?? null,
      profession: application.profession ?? null,
      experience: application.experience ?? null,
      portfolio: application.portfolio ?? "",
      linkedIn: application.linkedIn ?? "",
      github: application.github ?? "",
      skillsOffered: application.skillsOffered ?? [],
      skillsLookingFor: application.skillsLookingFor ?? [],
    };
    const claimPayload = JSON.stringify({ status: "used", usedAt: now, userId: createdUid });
    const rows = await sql.query(
      "with claimed as (update invites set status='used',payload=payload || $3::jsonb where id=$1 and status not in ('used','revoked') and (expires_at is null or expires_at>now()) returning id) insert into users (id,email,full_name,profession,country,time_zone,skill_hours,is_verified,created_at,updated_at,payload) select $2,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12::jsonb from claimed returning id",
      [invite.id, createdUid, claimPayload, normalizedEmail, application.fullName ?? null, application.profession ?? null, application.country ?? null, application.timeZone ?? null, startingHours, isVerified, now, JSON.stringify(userPayload)],
    );
    if (!rows.length) throw new Error("This invitation was already claimed or expired");
    return { success: true };
  } catch (error) {
    if (createdUid) {
      try { await deleteFirebaseUser(createdUid); } catch (cleanupError) { console.error("Unable to roll back Firebase Auth user", cleanupError); }
    }
    console.error("Error during registration", error);
    return { error: error instanceof Error ? error.message : "Registration failed" };
  }
}
