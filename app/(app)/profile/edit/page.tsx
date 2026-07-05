import { getCurrentUserId } from "@/app/actions/user";
import { db } from "@/lib/firebase-admin";
import { User } from "@/types";
import { notFound, redirect } from "next/navigation";
import EditProfileForm from "@/components/profile/edit-profile-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Edit Profile | Weave",
  description: "Update your Weave profile information.",
};

export default async function EditProfilePage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/login");
  }

  if (!db) {
    throw new Error("Firestore not initialized");
  }

  const userDoc = await db.collection("users").doc(userId).get();
  
  if (!userDoc.exists) {
    notFound();
  }

  const user = { uid: userDoc.id, ...userDoc.data() } as User;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-8 md:py-12">
        <div className="mb-8">
          <Link 
            href={`/u/${user.username}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-heading">Edit Profile</h1>
          <p className="text-body text-sm mt-2">Manage your public information and skills.</p>
        </div>

        <EditProfileForm user={user} />
      </div>
    </div>
  );
}
