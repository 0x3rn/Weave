import Header from "../../../components/header";
import Footer from "../../../components/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Community Guidelines | Weave",
  description: "Learn about the standards and values we expect every member to uphold.",
};

export default function CommunityGuidelinesPage() {
  return (
    <>
      <Header />
      
      <main className="bg-background pt-8 pb-16 md:pt-12 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-primary transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="bg-surface border border-border rounded-2xl p-8 md:p-16 shadow-subtle">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-heading mb-6">
              Community Guidelines
            </h1>
            <p className="text-muted font-medium mb-12">
              Effective Date: July 2026
            </p>

            <div className="prose prose-lg prose-headings:text-heading prose-headings:font-bold prose-p:text-body prose-p:leading-relaxed prose-li:text-body prose-a:text-primary max-w-none">
              
              <p>Welcome to <strong>Weave</strong>.</p>
              <p>
                Weave exists to help independent professionals collaborate through trust, accountability, and mutual respect. These Community Guidelines explain the standards we expect every member to uphold while using the Platform.
              </p>
              <p>
                They are designed to create an environment where developers, designers, writers, marketers, founders, and other professionals can confidently exchange their expertise through Skill Hours.
              </p>
              <p>
                By using Weave, you agree to follow these guidelines in addition to our Terms of Service and other applicable policies.
              </p>

              <hr className="my-10 border-border" />

              <h2>Our Community Values</h2>
              <p>Everything we build is guided by five principles.</p>

              <h3>Trust</h3>
              <p>Trust is earned through honesty, consistency, and accountability. Every interaction should contribute to making Weave a safer place for everyone.</p>

              <h3>Professionalism</h3>
              <p>Treat every exchange as you would with a valued client or long-term business partner. Professional communication, reliability, and respect create stronger relationships.</p>

              <h3>Collaboration</h3>
              <p>We believe collaboration creates more value than competition. Support other members, communicate openly, and work together toward successful outcomes.</p>

              <h3>Integrity</h3>
              <p>Be truthful about your experience, qualifications, availability, and the work you deliver. Integrity strengthens the entire marketplace.</p>

              <h3>Respect</h3>
              <p>Every member deserves to be treated with dignity regardless of their experience level, background, nationality, or profession.</p>

              <h2>Building an Honest Profile</h2>
              <p>Your profile is your professional identity on Weave. Please ensure that it accurately represents who you are.</p>
              <p>You should:</p>
              <ul>
                <li>Use your real name or professional identity.</li>
                <li>Upload a professional profile photo.</li>
                <li>Describe your skills honestly.</li>
                <li>Share genuine portfolio work.</li>
                <li>List only experience you actually possess.</li>
                <li>Keep your information up to date.</li>
              </ul>
              <p>Do not:</p>
              <ul>
                <li>Impersonate another person.</li>
                <li>Create fake profiles or purchase fake reviews.</li>
                <li>Use misleading credentials or falsify certifications.</li>
              </ul>
              <p>Trust begins with authenticity.</p>

              <h2>Communicating with Other Members</h2>
              <p>Professional communication is expected at all times.</p>
              <p>We encourage you to:</p>
              <ul>
                <li>Be polite and respectful.</li>
                <li>Respond within a reasonable timeframe.</li>
                <li>Ask questions when expectations are unclear.</li>
                <li>Provide constructive feedback.</li>
                <li>Respect different opinions and resolve disagreements calmly.</li>
              </ul>
              <p>Avoid:</p>
              <ul>
                <li>Personal attacks, Harassment, Threats, or Intimidation.</li>
                <li>Discrimination, Excessive profanity, Hate speech, or Abusive language.</li>
              </ul>

              <h2>Creating Fair Exchanges</h2>
              <p>Before beginning work, make sure both members clearly understand Deliverables, Scope of work, Number of Skill Hours, Deadlines, Revision expectations, Communication preferences, and Completion criteria.</p>

              <h2>Deliver Your Best Work</h2>
              <p>Every completed exchange contributes to your professional reputation. When accepting an exchange, you should Deliver work you are qualified to perform, Meet agreed deadlines whenever possible, Communicate early if delays occur, Be honest about challenges, Submit original work, and Respect revision agreements. If unexpected circumstances arise, communicate with the other member as soon as possible.</p>

              <h2>Respect Intellectual Property</h2>
              <p>Only upload or share content that you own or have permission to use.</p>
              <p>Do not Copy another person's work, Submit plagiarized content, Use pirated software or assets, Share confidential client materials without permission, or Violate copyrights, trademarks, or other intellectual property rights. Professional trust depends on respecting the work of others.</p>

              <h2>Reviews and Reputation</h2>
              <p>Reviews help members make informed decisions.</p>
              <p>When leaving a review, Be honest, Be fair, Be respectful, and Focus on the work performed. Do not Leave retaliatory reviews, Threaten negative reviews to gain leverage, Exchange fake positive reviews, or Attempt to manipulate reputation scores.</p>

              <h2>Responsible Use of Skill Hours</h2>
              <p>Skill Hours are the foundation of the Weave marketplace. Use them responsibly. Do not Attempt to exploit the Skill Hour system, Create fake exchanges, Artificially inflate balances, Coordinate fraudulent transactions, Abuse platform rewards, or Circumvent marketplace safeguards.</p>

              <h2>Escrow Expectations</h2>
              <p>If your exchange requires escrow: Submit deposits honestly, Complete agreed work, Confirm completion promptly, and Participate in dispute resolution respectfully if necessary. Do not misuse escrow to pressure, threaten, or manipulate another member. Escrow exists to promote accountability—not conflict.</p>

              <h2>Keep the Marketplace Safe</h2>
              <p>Help us maintain a trustworthy community. Report members who engage in Fraud, Identity theft, Scams, Fake profiles, Spam, Harassment, Abuse, Intellectual property violations, or Security concerns. False reports intended to harm another member may themselves violate these Guidelines.</p>

              <h2>Content Standards</h2>
              <p>Content shared on Weave should contribute positively to the community. Content must not include Hate speech, Violence or threats, Terrorist content, Illegal material, Sexually explicit material, Graphic violence, Malware, Fraudulent schemes, Spam, or Misleading information intended to deceive others. We reserve the right to remove content that violates these standards.</p>

              <h2>Respect Privacy</h2>
              <p>Members often share sensitive project information. Please Respect confidential information, Protect client materials, Avoid sharing private conversations publicly, Obtain permission before distributing another person's work, and Handle personal information responsibly.</p>

              <h2>Artificial Intelligence</h2>
              <p>AI tools may be used to assist your work where appropriate. However, Do not misrepresent AI-generated work as entirely your own if doing so would mislead another member, Ensure AI-assisted work meets agreed quality standards, Review all AI-generated output before delivery, and Respect licensing requirements for AI-generated content where applicable.</p>

              <h2>What Happens When Guidelines Are Violated?</h2>
              <p>Depending on the severity of a violation, Weave may take one or more of the following actions: Educational warning, Content removal, Temporary feature restrictions, Marketplace limitations, Verification removal, Account suspension, Permanent account termination, or Referral to appropriate authorities where legally required.</p>

              <h2>Help Us Build a Better Community</h2>
              <p>Great communities are created by their members. You can help by Welcoming new professionals, Sharing knowledge, Providing thoughtful feedback, Honoring your commitments, Reporting genuine concerns, and Leading by example.</p>

              <h2>Our Commitment</h2>
              <p>In return, Weave is committed to Treating members fairly, Moderating consistently, Improving platform safety, Listening to community feedback, Building features that encourage trust, and Protecting the integrity of Skill Hour exchanges.</p>

              <h2>Contact Us</h2>
              <p>If you have questions about these Community Guidelines or wish to report behavior that violates them, please contact us.</p>
              <p>
                <strong>Community Support:</strong> <a href="mailto:community@weave.com">community@weave.com</a><br/>
                <strong>General Support:</strong> <a href="mailto:support@weave.com">support@weave.com</a>
              </p>

              <div className="bg-surface-secondary border border-border p-6 rounded-[var(--radius-card)] mt-12 text-center">
                <h3 className="text-xl font-bold text-heading mt-0 mb-3">Final Note</h3>
                <p className="mb-0 text-sm leading-relaxed">
                  Weave is more than a marketplace—it is a professional community built on trust. Every profile, every conversation, every review, and every Skill Hour exchange contributes to the culture we create together. By treating others with honesty, professionalism, and respect, we can build a network where independent professionals collaborate with confidence and create opportunities that extend far beyond a single project.
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
