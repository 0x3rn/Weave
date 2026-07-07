import { getLedgerData } from "@/app/actions/ledger";
import LedgerClient from "@/components/ledger/ledger-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Ledger | Weave",
  description: "Your transparent Skill Hour transaction history.",
};

export default async function WalletPage() {
  try {
    const data = await getLedgerData();
    return <LedgerClient initialData={data} />;
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      redirect("/login");
    }
    
    return (
      <div className="min-h-full bg-background flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-heading mb-2">Failed to load ledger</h1>
        <p className="text-body max-w-md">{error.message || "An unexpected error occurred."}</p>
      </div>
    );
  }
}
