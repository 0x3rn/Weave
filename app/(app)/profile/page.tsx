import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/actions/user";
import { db } from "@/lib/firebase-admin";
import SetUsernameClient from "./set-username-client";

export default async function ProfilePage() {
  const currentUserId = await getCurrentUserId();
  
  if (!currentUserId || !db) {
    redirect("/login");
  }

  // Fetch the user document to see if they have a username
  const userDoc = await db.collection("users").doc(currentUserId).get();
  const userData = userDoc.data();

  if (userData && userData.username) {
    redirect(`/u/${userData.username}`);
  }

  // If they don't have a username, render a client component to set one
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SetUsernameClient />
    </div>
  );
}
