import Header from "../../../components/header";
import Footer from "../../../components/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Acceptable Use Policy | Weave",
  description: "Learn about the rules and guidelines for using the Weave platform.",
};

export default function AcceptableUsePolicyPage() {
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
              Acceptable Use Policy
            </h1>
            <p className="text-muted font-medium mb-12">
              Effective Date: July 2026
            </p>

            <div className="prose prose-lg prose-headings:text-heading prose-headings:font-bold prose-p:text-body prose-p:leading-relaxed prose-li:text-body prose-a:text-primary max-w-none">
              
              <p>
                This Acceptable Use Policy ("Policy") explains the rules for using the Weave platform ("Weave," "we," "our," or "us"). It exists to protect our members, maintain a trustworthy marketplace, and ensure the Platform remains a safe environment for professional collaboration.
              </p>
              <p>
                This Policy forms part of our Terms of Service. By accessing or using Weave, you agree to comply with this Policy.
              </p>

              <hr className="my-10 border-border" />

              <h2>1. Purpose</h2>
              <p>Weave is built to help independent professionals collaborate by exchanging services through Skill Hours. To maintain a safe and productive community, every member is expected to use the Platform responsibly, ethically, and lawfully.</p>
              <p>You are responsible for all activity that occurs under your account.</p>

              <h2>2. Lawful Use</h2>
              <p>You may only use Weave for lawful purposes. You agree not to use the Platform in any way that Violates applicable laws or regulations, Encourages illegal activity, Assists criminal behavior, Facilitates fraud or deception, or Infringes the rights of others.</p>
              <p>You remain responsible for ensuring your use of Weave complies with the laws applicable to you.</p>

              <h2>3. Account Integrity</h2>
              <p>You may not Create multiple accounts to avoid restrictions, Share your account credentials, Allow another person to use your account, Create fake identities, Impersonate another individual or organization, Use misleading profile information, or Attempt to bypass verification requirements.</p>
              <p>Accounts must accurately represent the individual or organization using them.</p>

              <h2>4. Marketplace Integrity</h2>
              <p>You may not misuse the marketplace by Creating fake service requests, Creating fake exchanges, Artificially increasing reputation, Manipulating Skill Hour balances, Misrepresenting deliverables, Posting misleading opportunities, or Attempting to deceive other members.</p>
              <p>Every exchange should represent a genuine intention to collaborate professionally.</p>

              <h2>5. Fraud and Financial Abuse</h2>
              <p>The following activities are strictly prohibited: Payment fraud, Chargeback abuse, Escrow manipulation, Identity theft, False verification documents, Money laundering, Financial scams, Creating fraudulent transactions, and Attempting to obtain Skill Hours dishonestly.</p>
              <p>Confirmed fraudulent activity may result in immediate account termination and, where appropriate, referral to relevant authorities.</p>

              <h2>6. Security</h2>
              <p>You may not Attempt unauthorized access to any account, Test or exploit security vulnerabilities without authorization, Circumvent authentication systems, Interfere with Platform infrastructure, Upload malware or malicious code, Distribute viruses, ransomware, spyware, or similar software, or Disrupt services through automated attacks or excessive requests.</p>
              <p>Any attempt to compromise the security or stability of Weave is strictly prohibited.</p>

              <h2>7. Automated Access</h2>
              <p>Unless expressly authorized by Weave, you may not Use bots to interact with the Platform, Scrape Platform content, Automatically collect user information, Crawl the marketplace, Reverse engineer Platform functionality, or Attempt to extract proprietary data.</p>
              <p>Reasonable indexing by publicly recognized search engines is permitted where applicable.</p>

              <h2>8. Respect for Other Members</h2>
              <p>You may not Harass another member, Bully or intimidate users, Threaten violence, Encourage self-harm, Stalk individuals, Discriminate against others, Publish hateful content, Share another person's private information without permission, or Engage in abusive behavior.</p>
              <p>Professional disagreements should always be handled respectfully.</p>

              <h2>9. Content Restrictions</h2>
              <p>You may not upload, publish, transmit, or share content that Is unlawful, Is fraudulent, Is defamatory, Is obscene, Is sexually explicit, Promotes violence, Contains hate speech, Contains terrorist or extremist material, Violates another person's intellectual property rights, Includes malware or malicious software, or Is intended to deceive users.</p>
              <p>We reserve the right to remove prohibited content without prior notice.</p>

              <h2>10. Intellectual Property</h2>
              <p>Respect the intellectual property rights of others. You may not Upload stolen work, Distribute copyrighted material without permission, Use pirated software or assets, Claim another person's work as your own, Remove copyright notices, or Violate trademarks or patents.</p>
              <p>Members remain responsible for ensuring they have the necessary rights to all content they upload.</p>

              <h2>11. Spam and Unsolicited Communications</h2>
              <p>The Platform may not be used to Send spam, Send mass unsolicited messages, Promote unrelated products or services, Conduct phishing campaigns, Harvest email addresses, or Send repetitive promotional content.</p>
              <p>Communication should remain relevant to legitimate professional collaboration.</p>

              <h2>12. Platform Abuse</h2>
              <p>You may not interfere with the normal operation of Weave by Attempting to overload servers, Disrupting other members' activities, Exploiting software bugs, Circumventing usage limits, Manipulating search results, Attempting to bypass moderation systems, or Misusing reporting tools.</p>
              <p>Any attempt to undermine Platform integrity may result in immediate enforcement action.</p>

              <h2>13. Artificial Intelligence</h2>
              <p>Members may use AI tools to support their work provided they Review all generated content before delivery, Ensure work meets agreed quality standards, Respect intellectual property rights, Do not knowingly submit misleading or harmful AI-generated content, and Do not use AI to impersonate another person or fabricate evidence during disputes.</p>
              <p>Members remain fully responsible for all work submitted through the Platform, regardless of whether AI tools were used.</p>

              <h2>14. Reporting Violations</h2>
              <p>If you believe another member has violated this Policy, you are encouraged to report the matter through the Platform or by contacting our support team.</p>
              <p>Please provide as much relevant information as possible, including screenshots, messages, or other supporting evidence where available. Knowingly submitting false or malicious reports may itself violate this Policy.</p>

              <h2>15. Enforcement</h2>
              <p>Depending on the nature and severity of a violation, Weave may take one or more of the following actions: Issue a warning, Remove content, Restrict access to specific features, Suspend Skill Hour activity, Remove verification status, Suspend the account, Permanently terminate the account, Reverse fraudulent transactions where appropriate, or Cooperate with law enforcement where legally required.</p>
              <p>Enforcement decisions are made at our reasonable discretion to protect the Platform and its members.</p>

              <h2>16. Changes to This Policy</h2>
              <p>We may update this Acceptable Use Policy from time to time to reflect changes in our services, technology, legal obligations, or community needs. When material changes are made, we will update the Effective Date and may notify members through the Platform or by email where appropriate.</p>
              <p>Your continued use of Weave after the revised Policy becomes effective constitutes acceptance of the updated version.</p>

              <h2>17. Contact Us</h2>
              <p>If you have questions regarding this Acceptable Use Policy or wish to report a violation, please contact us.</p>
              <p>
                <strong>Support:</strong> <a href="mailto:support@weave.com">support@weave.com</a><br/>
                <strong>Legal:</strong> <a href="mailto:legal@weave.com">legal@weave.com</a>
              </p>

              <div className="bg-surface-secondary border border-border p-6 rounded-[var(--radius-card)] mt-12 text-center">
                <h3 className="text-xl font-bold text-heading mt-0 mb-3">Summary</h3>
                <p className="mb-0 text-sm leading-relaxed">
                  Weave is built on trust, professionalism, and collaboration. This Acceptable Use Policy exists to ensure that every member can participate in a secure, respectful, and reliable environment. By using the Platform responsibly and respecting these rules, you help create a stronger community where independent professionals can confidently exchange their expertise and build lasting professional relationships.
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
