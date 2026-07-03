import Header from "../../../components/header";
import Footer from "../../../components/footer";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Application Received | Weave",
};

export default function RequestInviteSuccessPage() {
  return (
    <>
      <Header />
      
      <main className="bg-background min-h-[70vh] flex items-center justify-center py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl text-center">
          
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-heading mb-6">
            You're on the list
          </h1>
          
          <div className="text-lg text-body space-y-4 mb-12 bg-surface border border-border p-8 rounded-[var(--radius-card)]">
            <p className="font-medium text-heading">Thanks for applying.</p>
            <p>We'll review your application and email you if you're invited to join Weave.</p>
          </div>

          <div className="flex justify-center">
            <Link href="/" className="px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle">
              Return Home
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
