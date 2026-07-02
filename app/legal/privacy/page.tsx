import Header from "../../../components/header";
import Footer from "../../../components/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Weave",
  description: "Learn how Weave collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-muted font-medium mb-12">
              Effective Date: July 2026
            </p>

            <div className="prose prose-lg prose-headings:text-heading prose-headings:font-bold prose-p:text-body prose-p:leading-relaxed prose-li:text-body prose-a:text-primary max-w-none">
              
              <p>
                Welcome to <strong>Weave</strong> ("Weave," "we," "our," or "us"). Your privacy matters to us, and we are committed to protecting the personal information you share with us.
              </p>
              <p>
                This Privacy Policy explains what information we collect, how we use it, when we share it, and the choices you have regarding your information when using our website, applications, and services (collectively, the "Platform").
              </p>
              <p>
                By accessing or using Weave, you acknowledge that you have read and understood this Privacy Policy.
              </p>

              <hr className="my-10 border-border" />

              <h2>1. Information We Collect</h2>
              <p>To provide our services, we collect information that helps us create accounts, facilitate Skill Hour exchanges, improve the Platform, and maintain a safe community.</p>
              
              <h3>Information You Provide</h3>
              <p>When you create an account or interact with Weave, you may provide information such as:</p>
              <ul>
                <li>Full name and Username</li>
                <li>Email address</li>
                <li>Password (stored securely through our authentication provider)</li>
                <li>Profile photo and Biography</li>
                <li>Professional title</li>
                <li>Skills offered and Skills requested</li>
                <li>Portfolio links, Website links, LinkedIn, GitHub, or other professional profiles</li>
                <li>Country or region</li>
                <li>Availability</li>
                <li>Messages you send through the Platform</li>
                <li>Reviews and ratings you submit</li>
                <li>Support requests, Feedback and survey responses</li>
              </ul>
              <p>Some information is optional, but providing additional details may improve your experience and increase trust within the community.</p>

              <h2>2. Verification Information</h2>
              <p>If you choose to become a Verified member, we may collect additional information necessary to complete the verification process. Depending on the verification method, this may include:</p>
              <ul>
                <li>Government-issued identification</li>
                <li>Professional portfolio</li>
                <li>Business information</li>
                <li>Additional verification documents</li>
              </ul>
              <p>Verification information is used solely for identity and trust verification and is handled with appropriate security measures.</p>

              <h2>3. Skill Exchange Information</h2>
              <p>To facilitate exchanges between members, we collect information related to your activity on the Platform, including:</p>
              <ul>
                <li>Skill requests and offers</li>
                <li>Accepted exchanges</li>
                <li>Skill Hour balances and Ledger history</li>
                <li>Escrow activity</li>
                <li>Completion confirmations, Reviews, and Reputation history</li>
                <li>Dispute records and Uploaded project files</li>
              </ul>

              <h2>4. Payment Information</h2>
              <p>Certain features of Weave may require payment, including subscriptions or escrow deposits. Payment information is processed by trusted third-party payment providers. Weave does not store complete payment card numbers or sensitive financial credentials on our servers. We may receive limited payment-related information such as:</p>
              <ul>
                <li>Payment status and Subscription status</li>
                <li>Transaction identifiers</li>
                <li>Billing country and Invoice history</li>
              </ul>

              <h2>5. Information Collected Automatically</h2>
              <p>When you use the Platform, certain technical information may be collected automatically, including:</p>
              <ul>
                <li>IP address, Browser type, Device type, Operating system</li>
                <li>Language preferences and Time zone</li>
                <li>Pages visited and Features used</li>
                <li>Referring websites</li>
                <li>Crash reports, Session duration, and Log data</li>
              </ul>

              <h2>6. Cookies and Similar Technologies</h2>
              <p>We use cookies and similar technologies to keep you signed in, remember your preferences, improve website performance, measure usage, enhance security, prevent fraudulent activity, and analyze product usage. Additional information about cookies can be found in our Cookie Policy.</p>

              <h2>7. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Create and manage your account and provide access to the Platform</li>
                <li>Match members with relevant opportunities</li>
                <li>Maintain Skill Hour balances, process exchanges, and manage escrow transactions</li>
                <li>Improve search results and deliver requested services</li>
                <li>Verify identities</li>
                <li>Respond to customer support inquiries and send important service notifications</li>
                <li>Detect fraud and abuse, and protect the safety of our community</li>
                <li>Improve features and functionality</li>
                <li>Conduct analytics and comply with legal obligations</li>
              </ul>
              <p><strong>We do not sell your personal information.</strong></p>

              <h2>8. Community Visibility</h2>
              <p>Because Weave is a collaborative marketplace, certain profile information is visible to other members. Depending on your privacy settings, this may include your Name, Username, Profile picture, Biography, Skills, Portfolio, Reputation score, Reviews, Completed exchanges, and Verification badges. Only information necessary to facilitate collaboration is displayed publicly within the Platform.</p>

              <h2>9. Communications</h2>
              <p>We may send communications including account notifications, verification updates, exchange notifications, escrow updates, password reset emails, security alerts, product announcements, feature updates, and service-related messages. Where permitted by law, you may also receive marketing communications. You can unsubscribe from marketing emails at any time. Service-related notifications cannot always be disabled because they are necessary for operating your account.</p>

              <h2>10. Sharing Your Information</h2>
              <p>We may share information with trusted service providers who assist us in operating the Platform. Examples include Cloud hosting providers, Authentication providers, Payment processors, Email delivery services, Analytics providers, Customer support platforms, and Security and fraud prevention services. These providers may only process information as necessary to perform services on our behalf.</p>
              <p>We do not sell or rent your personal information to advertisers.</p>

              <h2>11. Legal Disclosures</h2>
              <p>We may disclose information when reasonably necessary to comply with applicable laws, respond to lawful requests, protect our legal rights, investigate fraud, enforce our Terms of Service, or protect users or the public from harm.</p>

              <h2>12. Data Security</h2>
              <p>We implement reasonable administrative, technical, and organizational safeguards designed to protect personal information from unauthorized access, disclosure, alteration, or destruction. Examples include Encrypted communications, Secure authentication, Access controls, Monitoring and logging, and Regular security improvements.</p>
              <p>No system can guarantee absolute security. Users are encouraged to protect their passwords and notify us immediately of any unauthorized account activity.</p>

              <h2>13. Data Retention</h2>
              <p>We retain information only for as long as necessary to operate the Platform, maintain exchange records, resolve disputes, meet legal obligations, enforce agreements, and improve our services. Certain records may be retained even after account deletion where required for legal, financial, fraud prevention, or security purposes.</p>

              <h2>14. Your Choices</h2>
              <p>Depending on your location and applicable laws, you may have the ability to access your personal information, update your profile, correct inaccurate information, delete your account, request deletion of certain data, export your data where available, control marketing communications, and manage cookie preferences. Some information may remain in backup systems or be retained where required by law.</p>

              <h2>15. Account Deletion</h2>
              <p>You may request deletion of your account at any time. When your account is deleted, your profile will no longer be visible, active subscriptions may be canceled, and historical exchange records may be preserved where necessary to maintain marketplace integrity.</p>

              <h2>16. Children's Privacy</h2>
              <p>Weave is intended for professionals and is not directed toward children. Individuals who do not meet the minimum age required to use our services under applicable law should not create an account.</p>

              <h2>17. International Users</h2>
              <p>Weave may be accessed from countries around the world. By using the Platform, you understand that your information may be processed and stored in jurisdictions different from your own, subject to appropriate safeguards where applicable.</p>

              <h2>18. Third-Party Services</h2>
              <p>The Platform may contain links or integrations with third-party websites or services (e.g., GitHub, LinkedIn, Payment providers). We are not responsible for the privacy practices of third-party services.</p>

              <h2>19. Policy Updates</h2>
              <p>We may update this Privacy Policy periodically to reflect changes in our services, legal requirements, or business practices. Your continued use of Weave after updates become effective constitutes acceptance of the revised Privacy Policy.</p>

              <h2>20. Contact Us</h2>
              <p>If you have questions, concerns, or requests regarding this Privacy Policy or how your information is handled, please contact us.</p>
              <p>
                <strong>Email:</strong> <a href="mailto:privacy@weave.com">privacy@weave.com</a><br/>
                <strong>Support:</strong> <a href="mailto:support@weave.com">support@weave.com</a>
              </p>

              <div className="bg-surface-secondary border border-border p-6 rounded-[var(--radius-card)] mt-12">
                <h3 className="text-xl font-bold text-heading mt-0 mb-3">Summary</h3>
                <p className="mb-0 text-sm leading-relaxed">
                  At Weave, trust is at the heart of everything we build. We collect only the information necessary to operate a secure, collaborative marketplace, protect our community, and improve your experience. We are committed to handling your information responsibly, transparently, and with respect.
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
