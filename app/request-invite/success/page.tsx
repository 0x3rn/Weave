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
            Application Received
          </h1>
          
          <div className="text-lg text-body space-y-4 mb-12 bg-surface border border-border p-8 rounded-[var(--radius-card)]">
            <p className="font-medium text-heading">Your application is under review.</p>
            <p>Thank you for requesting an invitation to Weave.</p>
            <p>Our team personally reviews every application to ensure we maintain a trusted and high-quality community of professionals.</p>
            <p>We will reach out via email if your application is approved for early access.</p>
            <p className="pt-4 border-t border-border text-sm text-muted">
              In the meantime, feel free to explore Weave and learn more about how Skill Hours work.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/#how-it-works" className="px-8 py-3 text-base font-bold text-surface bg-primary rounded-[var(--radius-button)] hover:bg-primary-hover transition-colors shadow-subtle">
              Learn How It Works
            </Link>
            <Link href="/" className="px-8 py-3 text-base font-bold text-heading bg-surface border border-border rounded-[var(--radius-button)] hover:bg-surface-secondary transition-colors">
              Return to Home
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
