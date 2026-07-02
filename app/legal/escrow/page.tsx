import Header from "../../../components/header";
import Footer from "../../../components/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Escrow Policy | Weave",
  description: "Learn how Weave's escrow system operates to ensure trust and accountability.",
};

export default function EscrowPolicyPage() {
  return (
    <>
      <Header />
      
      <main className="bg-background pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-primary transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="bg-surface border border-border rounded-2xl p-8 md:p-16 shadow-subtle">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-heading mb-6">
              Escrow Policy
            </h1>
            <p className="text-muted font-medium mb-12">
              Effective Date: July 2026
            </p>

            <div className="prose prose-lg prose-headings:text-heading prose-headings:font-bold prose-p:text-body prose-p:leading-relaxed prose-li:text-body prose-a:text-primary max-w-none">
              
              <p>
                This Escrow Policy explains how Weave's escrow system operates for Skill Hour exchanges between members. It forms part of our Terms of Service and applies whenever an exchange requires an escrow deposit.
              </p>
              <p>
                The purpose of escrow is not to function as a payment for services. Instead, it exists to encourage accountability, reduce fraudulent behavior, and help create a more trustworthy marketplace for all members.
              </p>
              <p>
                By participating in an exchange that requires escrow, you agree to this Escrow Policy.
              </p>

              <hr className="my-10 border-border" />

              <h2>1. Purpose of Escrow</h2>
              <p>Weave's escrow system is designed to encourage both parties to honor the commitments they make before an exchange begins.</p>
              <p>Rather than paying for services through the Platform, members may be asked to place a refundable escrow deposit before work starts. When both parties successfully complete the agreed exchange, the escrow deposits are generally returned to their original payment method or otherwise handled in accordance with this Policy.</p>
              <p>Escrow helps reduce abandoned projects, last-minute cancellations, and other forms of marketplace abuse.</p>

              <h2>2. When Escrow Is Required</h2>
              <p>Escrow may be required for:</p>
              <ul>
                <li>First-time collaborations between members.</li>
                <li>High-value Skill Hour exchanges.</li>
                <li>Members with limited reputation history.</li>
                <li>Exchanges flagged for additional trust safeguards.</li>
                <li>Any exchange where Weave determines escrow is appropriate.</li>
              </ul>
              <p>Not every exchange will require escrow. We reserve the right to modify when escrow is required as the Platform evolves.</p>

              <h2>3. Escrow Deposits</h2>
              <p>Before an eligible exchange begins, both participating members may be required to submit an escrow deposit. The required deposit amount will be clearly displayed before the exchange is confirmed.</p>
              <p>Escrow deposits:</p>
              <ul>
                <li>Are separate from Skill Hours.</li>
                <li>Are not considered payment for professional services.</li>
                <li>Do not determine the value of the work being exchanged.</li>
                <li>Exist solely as a trust and accountability mechanism.</li>
              </ul>
              <p>Failure to submit the required escrow deposit may prevent an exchange from starting.</p>

              <h2>4. Holding Escrow Funds</h2>
              <p>Escrow deposits are held until one of the following occurs:</p>
              <ul>
                <li>Both members confirm successful completion.</li>
                <li>An approved cancellation occurs before work begins.</li>
                <li>A dispute is resolved.</li>
                <li>Another outcome is determined under this Policy.</li>
              </ul>
              <p>Funds remain unavailable while the exchange is active.</p>

              <h2>5. Completing an Exchange</h2>
              <p>After the agreed work has been delivered, both members should review the exchange and confirm whether it has been completed successfully.</p>
              <p>Once both parties confirm completion:</p>
              <ul>
                <li>The exchange is marked as complete.</li>
                <li>Skill Hours are transferred according to the agreed terms.</li>
                <li>Escrow deposits are released, subject to any applicable processing times.</li>
              </ul>
              <p>Members are encouraged to inspect all deliverables before confirming completion.</p>

              <h2>6. Mutual Cancellations</h2>
              <p>If both members agree to cancel an exchange before meaningful work has begun, the exchange may be canceled by mutual consent.</p>
              <p>In most cases:</p>
              <ul>
                <li>No Skill Hours are transferred.</li>
                <li>Escrow deposits are refunded.</li>
                <li>The exchange is closed without affecting reputation.</li>
              </ul>
              <p>Repeated cancellations intended to manipulate the marketplace may result in moderation actions.</p>

              <h2>7. Unresponsive Members</h2>
              <p>If one member becomes inactive or fails to respond during an exchange, the other member may report the issue through the Platform.</p>
              <p>Depending on the circumstances, Weave may Contact both parties, Request additional information, Allow additional response time, Cancel the exchange, Release escrow according to available evidence, or Apply other appropriate measures. Each situation is evaluated individually.</p>

              <h2>8. Disputes</h2>
              <p>When members cannot agree on whether an exchange has been completed appropriately, either party may initiate a dispute. Disputes should be submitted promptly and include any relevant evidence. Examples include Messages, Files, Screenshots, Project deliverables, Revision history, and Timeline information. Providing complete and accurate information helps us review disputes more effectively.</p>

              <h2>9. Dispute Review</h2>
              <p>When reviewing a dispute, Weave may consider The original agreement, Communication between members, Submitted evidence, Delivered work, Revision requests, Platform activity, Completion history, and Previous marketplace behavior.</p>
              <p>Our goal is to reach a fair and reasonable outcome based on the information available. We may request additional information from either party before making a decision.</p>

              <h2>10. Possible Outcomes</h2>
              <p>Following review, Weave may determine that:</p>
              <ul>
                <li>The exchange was completed successfully.</li>
                <li>Additional work should be completed before the exchange can close.</li>
                <li>The exchange should be canceled.</li>
                <li>Escrow should remain temporarily held.</li>
                <li>Skill Hour transfers should be adjusted.</li>
                <li>Escrow deposits should be released according to the circumstances.</li>
              </ul>
              <p>Every dispute is evaluated individually.</p>

              <h2>11. Fraud and Abuse</h2>
              <p>The escrow system may not be used to Intentionally delay projects, Pressure another member unfairly, Submit false disputes, Harass other members, Manipulate Skill Hour balances, Create fake exchanges, Circumvent Platform safeguards, or Commit fraud.</p>
              <p>Attempts to abuse the escrow system may result in Account suspension, Account termination, Loss of verification status, Marketplace restrictions, or Permanent removal from Weave.</p>
              <p>Where permitted by applicable law, escrow deposits may also be forfeited in cases involving confirmed fraudulent conduct or serious abuse of the Platform.</p>

              <h2>12. Escrow Refunds</h2>
              <p>When an exchange concludes successfully or is canceled in accordance with this Policy, eligible escrow deposits are generally refunded. Refund processing times depend on the payment provider and financial institution involved. While Weave processes releases promptly after an eligible outcome, we cannot guarantee the time required for funds to appear in your account.</p>

              <h2>13. Payment Providers</h2>
              <p>Escrow deposits are processed through trusted third-party payment providers. Those providers may have their own Processing timelines, Verification requirements, Security procedures, Terms of service, and Privacy policies. Weave is not responsible for delays caused by financial institutions or payment providers after an escrow release has been initiated.</p>

              <h2>14. Platform Decisions</h2>
              <p>To maintain fairness and protect the integrity of the marketplace, Weave may make administrative decisions regarding escrow where appropriate. These decisions are made in good faith based on the information reasonably available at the time. While we strive for fair outcomes, no review process can guarantee a result that satisfies every party.</p>

              <h2>15. Limitation of Responsibility</h2>
              <p>Weave provides tools that facilitate escrow-based accountability but is not a party to the underlying professional agreement between members.</p>
              <p>Accordingly, Weave does not guarantee The quality of work delivered, The success of any project, Member performance, Business outcomes, Financial results, or Compatibility between collaborators. Members remain responsible for evaluating potential collaborators and clearly defining the scope of each exchange before work begins.</p>

              <h2>16. Changes to This Policy</h2>
              <p>We may update this Escrow Policy from time to time to reflect changes in our Platform, marketplace operations, legal requirements, or security practices. When significant changes are made, we will update the Effective Date and may notify members through the Platform or by email where appropriate. Continued use of Weave after changes become effective constitutes acceptance of the updated Policy.</p>

              <h2>17. Contact Us</h2>
              <p>If you have questions about this Escrow Policy or need assistance with an escrow-related matter, please contact us.</p>
              <p>
                <strong>Support:</strong> <a href="mailto:support@weave.com">support@weave.com</a><br/>
                <strong>Legal:</strong> <a href="mailto:legal@weave.com">legal@weave.com</a>
              </p>

              <div className="bg-surface-secondary border border-border p-6 rounded-[var(--radius-card)] mt-12 text-center">
                <h3 className="text-xl font-bold text-heading mt-0 mb-3">Summary</h3>
                <p className="mb-0 text-sm leading-relaxed">
                  Weave's escrow system exists to strengthen trust—not to replace it. By encouraging accountability from both parties before work begins, escrow helps create a safer environment for professional collaboration. Combined with Skill Hours, member reputation, verification, and transparent communication, escrow is one of several tools designed to support a fair, respectful, and reliable marketplace for everyone.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
