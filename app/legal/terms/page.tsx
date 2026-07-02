import Header from "../../../components/header";
import Footer from "../../../components/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Weave",
  description: "Read the Terms of Service governing your use of the Weave platform.",
};

export default function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <p className="text-muted font-medium mb-12">
              Effective Date: July 2026
            </p>

            <div className="prose prose-lg prose-headings:text-heading prose-headings:font-bold prose-p:text-body prose-p:leading-relaxed prose-li:text-body prose-a:text-primary max-w-none">
              
              <p>
                Welcome to <strong>Weave</strong> ("Weave," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the Weave website, applications, and related services (collectively, the "Platform").
              </p>
              <p>
                By creating an account, accessing, or using the Platform, you agree to be bound by these Terms. If you do not agree to these Terms, you should not access or use Weave.
              </p>

              <hr className="my-10 border-border" />

              <h2>1. About Weave</h2>
              <p>Weave is an invite-only platform designed to help independent professionals exchange services using Skill Hours rather than traditional monetary payments.</p>
              <p>Members may create professional profiles, request services, offer expertise, participate in Skill Hour exchanges, communicate with other members, maintain reputations, and access additional features provided by the Platform.</p>
              <p>Weave provides technology that facilitates these interactions but is not a party to agreements made directly between members.</p>

              <h2>2. Eligibility</h2>
              <p>To use Weave, you must:</p>
              <ul>
                <li>Meet the minimum legal age required to enter into binding agreements in your jurisdiction.</li>
                <li>Have the legal capacity to agree to these Terms.</li>
                <li>Provide accurate and complete registration information.</li>
                <li>Not be prohibited from using our services under applicable laws.</li>
                <li>Comply with all applicable laws and regulations while using the Platform.</li>
              </ul>
              <p>If you are using Weave on behalf of a business or organization, you represent that you have authority to bind that organization to these Terms.</p>

              <h2>3. Invite-Only Membership</h2>
              <p>Weave operates as an invite-only community. Submitting a waitlist request or invitation application does not guarantee access to the Platform. We reserve the right to:</p>
              <ul>
                <li>Approve or decline applications.</li>
                <li>Limit registrations.</li>
                <li>Suspend invitations.</li>
                <li>Modify onboarding requirements.</li>
                <li>Introduce additional verification requirements.</li>
              </ul>
              <p>Approval decisions are made at our discretion.</p>

              <h2>4. Your Account</h2>
              <p>To access many features, you must create an account. You agree to:</p>
              <ul>
                <li>Provide truthful information and keep your information current.</li>
                <li>Maintain the confidentiality of your login credentials.</li>
                <li>Be responsible for all activity under your account.</li>
                <li>Notify us promptly of any unauthorized access or suspected security incident.</li>
              </ul>
              <p>You may not share your account with another individual or allow others to access it on your behalf. We reserve the right to suspend or terminate accounts that violate these Terms.</p>

              <h2>5. Account Verification</h2>
              <p>Certain features may require verification. Verification may include identity checks, professional credentials, portfolio reviews, or other reasonable methods used to improve trust within the community. Verification does not guarantee the quality, reliability, or future conduct of any member. Users remain responsible for evaluating whether another member is suitable for a particular exchange.</p>

              <h2>6. Skill Hours</h2>
              <p>Skill Hours are the internal unit used to facilitate exchanges between members. Skill Hours:</p>
              <ul>
                <li>Have no cash value.</li>
                <li>Are not legal tender or cryptocurrency.</li>
                <li>Are not redeemable for money.</li>
                <li>May not be transferred outside the Platform except where expressly permitted.</li>
                <li>Exist solely for participation within Weave.</li>
              </ul>
              <p>Skill Hours are earned through successful exchanges completed on the Platform and may be spent requesting services from other members. We reserve the right to adjust Skill Hour balances where necessary to correct errors, investigate fraud, enforce these Terms, or maintain the integrity of the Platform.</p>

              <h2>7. Professional Exchanges</h2>
              <p>Members are responsible for clearly communicating the scope of every exchange before work begins. This includes, where applicable:</p>
              <ul>
                <li>Deliverables, Estimated Skill Hours, Deadlines</li>
                <li>Revision expectations, Required materials</li>
                <li>Communication preferences, Completion criteria</li>
              </ul>
              <p>Both parties should ensure they understand the agreed expectations before confirming an exchange. Weave is not responsible for misunderstandings arising from incomplete or unclear agreements between members.</p>

              <h2>8. Member Responsibilities</h2>
              <p>Every member is expected to contribute positively to the community. You agree to:</p>
              <ul>
                <li>Communicate respectfully, honor commitments, and deliver work to the best of your professional ability.</li>
                <li>Respond within reasonable timeframes and respect deadlines whenever possible.</li>
                <li>Provide accurate information and respect intellectual property rights.</li>
                <li>Leave honest and fair reviews and cooperate during dispute resolution.</li>
                <li>Follow our Community Guidelines and Acceptable Use Policy.</li>
              </ul>
              <p>Professionalism is a core principle of Weave, and repeated failure to meet these expectations may result in moderation actions.</p>

              <h2>9. User Content</h2>
              <p>You retain ownership of the content you submit to Weave, including your profile information, portfolio links, project descriptions, messages, reviews, and uploaded files. By submitting content to the Platform, you grant Weave a non-exclusive, worldwide, royalty-free license to host, store, display, reproduce, and process that content as necessary to operate, improve, and secure the Platform.</p>
              <p>You represent that you own the content you submit or have the necessary rights to use it, your content does not infringe the rights of others, and your content complies with these Terms and applicable laws. We reserve the right to remove content that violates these Terms or may harm the integrity of the Platform.</p>

              <h2>10. Profiles and Reputation</h2>
              <p>Profiles are intended to accurately represent a member's professional identity and experience. You agree not to misrepresent your skills or qualifications, falsify work history or portfolio items, purchase or manipulate reviews, create fake engagements to increase your reputation, or use misleading credentials or certifications.</p>
              <p>Reputation scores, reviews, verification badges, and other trust indicators are provided to help members make informed decisions. While we strive to maintain accurate information, Weave does not guarantee the accuracy, completeness, or reliability of any profile or reputation metric.</p>

              <h2>11. Availability of the Platform</h2>
              <p>We strive to keep Weave available and reliable, but we cannot guarantee uninterrupted access. The Platform may occasionally experience scheduled maintenance, software updates, security improvements, temporary outages, technical failures, or service interruptions beyond our control. We reserve the right to modify, suspend, or discontinue any feature or portion of the Platform at any time.</p>

              <h2>12. Changes to the Platform</h2>
              <p>As Weave evolves, we may introduce new features, remove existing functionality, adjust Skill Hour mechanics, improve verification processes, or modify marketplace functionality. We may also introduce new subscription plans, optional services, or community features. Continued use of the Platform after such changes constitutes acceptance of the updated services, subject to these Terms.</p>

              <h2>13. Marketplace Rules</h2>
              <p>The Weave marketplace is designed to facilitate professional collaboration through the exchange of Skill Hours. Members are responsible for ensuring that all listings, requests, offers, and communications accurately describe the services being exchanged. You agree not to create misleading listings, misrepresent deliverables, artificially inflate Skill Hour values, solicit fake exchanges, spam the marketplace, circumvent platform safeguards, manipulate search rankings, or interfere with other members' exchanges.</p>

              <h2>14. Exchange Agreements</h2>
              <p>Every accepted exchange represents an agreement between the participating members. Before work begins, both parties should clearly agree upon Scope of work, Deliverables, Estimated completion timeline, Number of Skill Hours, Required revisions, Completion expectations, and Communication methods. Members are encouraged to keep all communication related to an exchange within the Platform whenever possible.</p>

              <h2>15. Escrow</h2>
              <p>Certain exchanges may require both parties to participate in Weave's escrow process. Where applicable, both parties may be required to submit a refundable escrow deposit. Escrow funds are held solely to encourage accountability throughout the exchange. Escrow deposits are generally refunded once both parties confirm successful completion, but may be withheld temporarily while disputes are investigated. Fraudulent behavior may result in forfeiture of escrow deposits where permitted under our Escrow Policy and applicable law.</p>

              <h2>16. Skill Hour Ledger</h2>
              <p>Every completed exchange may result in changes to a member's Skill Hour balance. We maintain a ledger of Skill Hour transactions to help ensure transparency and accountability. The ledger may include Earned Skill Hours, Spent Skill Hours, Administrative adjustments, Refunds, Corrections, and Reversed transactions. We reserve the right to investigate irregular ledger activity and make reasonable corrections where errors, abuse, or fraud are identified.</p>

              <h2>17. Payments and Subscriptions</h2>
              <p>Some features of the Platform may require payment, including Verified memberships, Subscription plans, Escrow deposits, Optional premium services, and Future marketplace enhancements. All pricing is displayed before payment is required. By purchasing a subscription or paid feature, you authorize the applicable payment provider to process your payment. Unless otherwise stated, recurring subscriptions automatically renew until canceled. You are responsible for keeping your payment information current.</p>

              <h2>18. Billing</h2>
              <p>Subscription fees are generally billed in advance according to the billing cycle selected during purchase. Unless otherwise required by law, fees are non-refundable after the applicable billing period has begun, partial billing periods are not prorated, and taxes, where applicable, may be added at checkout. If a payment fails, we may retry payment, suspend premium features, or cancel your subscription after reasonable notice.</p>

              <h2>19. Cancellation</h2>
              <p>You may cancel a recurring subscription at any time through your account settings. Cancellation prevents future renewals but generally does not provide refunds for the current billing period unless otherwise required by law or expressly stated by Weave. Following cancellation, you may continue using paid features until the end of the active subscription period.</p>

              <h2>20. Reviews and Reputation</h2>
              <p>Members are encouraged to leave honest, respectful, and constructive reviews after completed exchanges. Reviews should reflect genuine experiences and should not contain False information, Personal attacks, Harassment, Hate speech, Confidential information, Threats, Spam, or Extortion or coercion. We reserve the right to remove or moderate reviews that violate these Terms or our Community Guidelines. However, Weave generally does not edit or remove reviews solely because a member disagrees with them.</p>

              <h2>21. Disputes Between Members</h2>
              <p>Although Weave provides tools intended to promote successful collaborations, disagreements may occur. When disputes arise, members are encouraged to Communicate respectfully, Attempt to resolve the matter directly, Provide relevant evidence where appropriate, and Cooperate with any Platform review process. Where an exchange involves escrow, Weave may review available information to assist in determining an appropriate outcome under our Escrow Policy. We reserve the right, but not the obligation, to facilitate dispute resolution.</p>

              <h2>22. Intellectual Property</h2>
              <p>The Weave Platform, including its design, branding, software, graphics, logos, interfaces, documentation, and original content, is owned by Weave or its licensors and is protected by applicable intellectual property laws. Except as expressly permitted, you may not Copy, Modify, Distribute, Reverse engineer, Sell, License, Reproduce, Create derivative works from, Publicly display, or Commercially exploit any portion of the Platform without prior written permission. Nothing in these Terms transfers ownership of Weave's intellectual property to users.</p>

              <h2>23. Intellectual Property Created During Exchanges</h2>
              <p>Unless otherwise agreed between participating members, ownership of work created during an exchange remains subject to the agreement reached by those members. Members are strongly encouraged to clarify, before work begins: Ownership of deliverables, Licensing rights, Commercial usage, Attribution requirements, Source file delivery, and Ongoing usage rights. Weave is not responsible for determining ownership of work produced through member collaborations.</p>

              <h2>24. Feedback</h2>
              <p>We welcome suggestions, ideas, feature requests, and other feedback regarding the Platform. If you voluntarily provide feedback, you grant Weave a non-exclusive, worldwide, perpetual, irrevocable, royalty-free license to use, modify, publish, and incorporate that feedback into the Platform without compensation or obligation to you.</p>

              <h2>25. Prohibited Conduct</h2>
              <p>To maintain a safe, trustworthy, and professional community, you agree not to use Weave to:</p>
              <ul>
                <li>Violate any applicable law or regulation.</li>
                <li>Create false or misleading accounts or impersonate another person.</li>
                <li>Misrepresent your identity, qualifications, or professional experience.</li>
                <li>Engage in fraud, deception, or scams.</li>
                <li>Circumvent the Skill Hour system or escrow process.</li>
                <li>Manipulate reviews, ratings, or reputation scores.</li>
                <li>Upload malicious software, viruses, or harmful code.</li>
                <li>Attempt unauthorized access to any account or system.</li>
                <li>Interfere with the operation or security of the Platform.</li>
                <li>Collect personal information about other users without authorization.</li>
                <li>Send spam or unsolicited commercial messages.</li>
                <li>Harass, intimidate, threaten, or abuse other members.</li>
                <li>Publish hateful, discriminatory, or defamatory content.</li>
                <li>Infringe the intellectual property rights of others.</li>
                <li>Use automated scripts, bots, or scraping tools without our written permission.</li>
                <li>Use the Platform for any unlawful, fraudulent, or harmful purpose.</li>
              </ul>
              <p>Violations may result in immediate enforcement actions.</p>

              <h2>26. Monitoring and Enforcement</h2>
              <p>We reserve the right, but are not obligated, to monitor activity on the Platform to help maintain security, reliability, and compliance with these Terms. Where appropriate, we may investigate reported violations, review content submitted to the Platform, remove content that violates these Terms, restrict access to certain features, suspend or terminate accounts, reverse Skill Hour transactions obtained through fraud or abuse, restrict participation in future exchanges, or cooperate with law enforcement or regulatory authorities where legally required. Our enforcement decisions are made in good faith and with the goal of protecting the integrity of the Weave community.</p>

              <h2>27. Account Suspension and Termination</h2>
              <p>We may suspend, restrict, or terminate your account if we reasonably believe you have violated these Terms, violated our Community Guidelines or Acceptable Use Policy, engaged in fraudulent or deceptive conduct, created significant security risks, harmed other members, misused Platform features, or failed to comply with applicable laws. We may also suspend or terminate accounts to comply with legal obligations or protect the Platform.</p>
              <p>You may stop using Weave and request deletion of your account at any time, subject to our Privacy Policy and applicable legal retention requirements. Termination does not automatically eliminate obligations that arose before the account was closed.</p>

              <h2>28. Third-Party Services</h2>
              <p>Weave may integrate with or provide links to third-party services, including authentication providers, payment processors, portfolio platforms, and communication tools. Your use of these services is governed by their respective terms and privacy policies. We are not responsible for the availability, accuracy, security, or practices of third-party services.</p>

              <h2>29. Service Availability</h2>
              <p>We strive to provide a reliable service, but Weave is offered on an "as available" basis. We do not guarantee that the Platform will always be available, every feature will remain unchanged, the Platform will operate without interruption, the Platform will be free of bugs or errors, every exchange will be successful, or every member will act professionally or fulfill their commitments. We continually improve the Platform but cannot guarantee uninterrupted or error-free operation.</p>

              <h2>30. Disclaimers</h2>
              <p>To the fullest extent permitted by applicable law: Weave provides a technology platform for facilitating professional collaboration. We do not employ, supervise, or control members. We do not guarantee the quality, legality, safety, or suitability of services offered by members. We do not guarantee the identity, qualifications, or reliability of any user, even if they have completed verification. We are not responsible for agreements entered into directly between members. We do not guarantee uninterrupted access or the achievement of any particular business or financial outcome. Members are responsible for exercising their own judgment before entering into exchanges.</p>

              <h2>31. Limitation of Liability</h2>
              <p>To the maximum extent permitted by applicable law, Weave and its owners, directors, employees, contractors, affiliates, licensors, and service providers shall not be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages arising out of or relating to your use of the Platform, member interactions, failed collaborations, loss of profits, loss of business opportunities, loss of data, reputation damage, service interruptions, or security incidents beyond our reasonable control. Where liability cannot be excluded under applicable law, our liability will be limited to the maximum extent permitted.</p>

              <h2>32. Indemnification</h2>
              <p>You agree to defend, indemnify, and hold harmless Weave and its affiliates, officers, employees, contractors, licensors, and service providers from any claims, damages, liabilities, losses, costs, or expenses (including reasonable legal fees) arising from your use of the Platform, your content, your exchanges with other members, your violation of these Terms, your violation of applicable law, or your infringement of another person's rights. This obligation survives termination of your account where permitted by law.</p>

              <h2>33. Force Majeure</h2>
              <p>We shall not be responsible for delays or failures resulting from circumstances beyond our reasonable control, including but not limited to Natural disasters, Internet outages, Power failures, Government actions, Labor disputes, Cyberattacks, Pandemics, Civil unrest, or Acts of war. Our obligations will resume as soon as reasonably practicable after the event has ended.</p>

              <h2>34. Changes to These Terms</h2>
              <p>We may update these Terms from time to time to reflect changes in our services, applicable laws, security requirements, business operations, or community standards. When material changes are made, we will update the Effective Date and may provide additional notice through the Platform or by email where appropriate. Your continued use of Weave after revised Terms become effective constitutes acceptance of the updated Terms.</p>

              <h2>35. Severability</h2>
              <p>If any provision of these Terms is found to be invalid, unlawful, or unenforceable, the remaining provisions shall continue in full force and effect to the maximum extent permitted by law.</p>

              <h2>36. No Waiver</h2>
              <p>Failure by Weave to enforce any provision of these Terms shall not constitute a waiver of that provision or any other right. Any waiver must be made expressly and in writing.</p>

              <h2>37. Entire Agreement</h2>
              <p>These Terms, together with our Privacy Policy, Cookie Policy, Escrow Policy, Community Guidelines, and Acceptable Use Policy, constitute the entire agreement between you and Weave regarding your use of the Platform and supersede any prior understandings relating to the same subject matter.</p>

              <h2>38. Governing Law</h2>
              <p>These Terms shall be governed by and interpreted in accordance with the laws of <strong>[Insert Jurisdiction]</strong>, without regard to its conflict of law principles. Any disputes arising from or relating to these Terms shall be resolved in the courts of <strong>[Insert Jurisdiction]</strong>, unless otherwise required by applicable law.</p>

              <h2>39. Contact Information</h2>
              <p>If you have questions regarding these Terms, please contact us.</p>
              <p>
                <strong>General Inquiries:</strong> <a href="mailto:hello@weave.com">hello@weave.com</a><br/>
                <strong>Support:</strong> <a href="mailto:support@weave.com">support@weave.com</a><br/>
                <strong>Legal:</strong> <a href="mailto:legal@weave.com">legal@weave.com</a>
              </p>

              <div className="bg-surface-secondary border border-border p-6 rounded-[var(--radius-card)] mt-12 text-center">
                <h3 className="text-xl font-bold text-heading mt-0 mb-3">Final Acknowledgement</h3>
                <p className="mb-0 text-sm leading-relaxed">
                  By accessing or using Weave, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. Our goal is to create a professional, trusted, and collaborative environment where independent professionals can exchange expertise with confidence. Every member contributes to the strength of this community by acting with honesty, professionalism, and respect.
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
