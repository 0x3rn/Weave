import { getCurrentUserId } from "@/app/actions/user";
import { getEscrowByExchangeId } from "@/app/actions/escrow";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import { Escrow, Exchange, User } from "@/types";
import EscrowDetailsClient from "@/components/escrow/escrow-details-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Escrow Details | Weave"
};

export default async function EscrowDetailsPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  if (!db) redirect("/dashboard");

  // Note: params.id is the escrow ID
  const escrowDoc = await db.collection("escrows").doc(params.id).get();
  if (!escrowDoc.exists) redirect("/dashboard/escrow");
  const escrow = { id: escrowDoc.id, ...escrowDoc.data() } as Escrow;
  if (!escrow.participants[userId]) redirect("/dashboard/escrow");

  // Fetch Exchange
  const exchangeDoc = await db.collection("exchanges").doc(escrow.exchangeId).get();
  const exchange = { id: exchangeDoc.id, ...exchangeDoc.data() } as Exchange;

  // Fetch Users
  const userDocs = await Promise.all([
    db.collection("users").doc(exchange.requesterId).get(),
    db.collection("users").doc(exchange.providerId).get()
  ]);

  const usersMap: Record<string, User> = {};
  userDocs.forEach(doc => {
    if (doc.exists) {
      const data = doc.data() as User;
      usersMap[doc.id] = { uid: doc.id, username: data.username, fullName: data.fullName, email: "", photoURL: data.photoURL ?? null, profession: data.profession, country: data.country, timeZone: data.timeZone, createdAt: data.createdAt, lastActive: "", skillsOffered: [], skillsLookingFor: [], stats: data.stats, trustScore: data.trustScore, isVerified: data.isVerified, profileCompletion: data.profileCompletion };
    }
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Link href="/dashboard/escrow" className="inline-flex items-center text-sm font-medium text-muted hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Escrows
      </Link>
      
      <EscrowDetailsClient 
        escrow={escrow} 
        exchange={exchange} 
        usersMap={usersMap} 
        currentUserId={userId} 
      />
    </div>
  );
}
