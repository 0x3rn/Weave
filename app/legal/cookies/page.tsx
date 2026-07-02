import Header from "../../../components/header";
import Footer from "../../../components/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Cookie Policy | Weave",
  description: "Learn how Weave uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
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
              Cookie Policy
            </h1>
            <p className="text-muted font-medium mb-12">
              Effective Date: July 2026
            </p>

            <div className="prose prose-lg prose-headings:text-heading prose-headings:font-bold prose-p:text-body prose-p:leading-relaxed prose-li:text-body prose-a:text-primary max-w-none">
              
              <p>
                This Cookie Policy explains how <strong>Weave</strong> ("Weave," "we," "our," or "us") uses cookies and similar technologies when you visit our website or use our platform.
              </p>
              <p>
                By continuing to use Weave, you acknowledge that cookies may be used as described in this Policy. Where required by applicable law, we will request your consent before placing certain types of cookies on your device.
              </p>

              <hr className="my-10 border-border" />

              <h2>1. What Are Cookies?</h2>
              <p>Cookies are small text files stored on your computer, tablet, or mobile device when you visit a website.</p>
              <p>Cookies help websites remember information about your visit, such as your preferences and login status, making future visits more convenient and improving your overall experience.</p>
              <p>In addition to cookies, we may use similar technologies such as local storage, pixels, web beacons, and software development kits (SDKs) where appropriate.</p>

              <h2>2. Why We Use Cookies</h2>
              <p>We use cookies to:</p>
              <ul>
                <li>Keep you signed in to your account.</li>
                <li>Remember your preferences and settings.</li>
                <li>Improve website performance.</li>
                <li>Understand how visitors use the Platform.</li>
                <li>Measure product usage and engagement.</li>
                <li>Improve reliability and user experience.</li>
                <li>Protect accounts against fraud and abuse.</li>
                <li>Diagnose technical issues.</li>
                <li>Support security features.</li>
                <li>Provide certain platform functionality.</li>
              </ul>
              <p><strong>We do not use cookies to sell your personal information.</strong></p>

              <h2>3. Types of Cookies We Use</h2>

              <h3>Essential Cookies</h3>
              <p>These cookies are necessary for the operation of Weave and cannot be disabled through our services.</p>
              <p>They help us:</p>
              <ul>
                <li>Authenticate users.</li>
                <li>Maintain secure sessions.</li>
                <li>Protect against fraudulent activity.</li>
                <li>Remember security preferences.</li>
                <li>Enable core functionality.</li>
              </ul>
              <p>Without these cookies, certain features of the Platform may not function properly.</p>

              <h3>Functional Cookies</h3>
              <p>These cookies remember choices you make to improve your experience.</p>
              <p>Examples include:</p>
              <ul>
                <li>Preferred language</li>
                <li>Theme preferences</li>
                <li>Time zone</li>
                <li>Recently viewed pages</li>
                <li>Dashboard settings</li>
              </ul>
              <p>These cookies help personalize your experience without identifying you beyond what is necessary for providing the service.</p>

              <h3>Analytics Cookies</h3>
              <p>Analytics cookies help us understand how visitors interact with Weave.</p>
              <p>We may use them to measure:</p>
              <ul>
                <li>Page views and Feature usage</li>
                <li>Navigation paths and Session duration</li>
                <li>Device types and Browser information</li>
                <li>General performance metrics</li>
              </ul>
              <p>This information is used to improve the Platform and prioritize future development. Whenever possible, analytics data is aggregated or pseudonymized.</p>

              <h3>Performance Cookies</h3>
              <p>Performance cookies help us:</p>
              <ul>
                <li>Improve loading times.</li>
                <li>Detect technical issues and Identify broken pages.</li>
                <li>Optimize website performance.</li>
                <li>Monitor system reliability.</li>
              </ul>
              <p>These cookies allow us to deliver a faster and more stable experience.</p>

              <h3>Security Cookies</h3>
              <p>Security cookies help protect both our users and the Platform.</p>
              <p>They may be used to:</p>
              <ul>
                <li>Detect suspicious login attempts.</li>
                <li>Prevent fraudulent activity and Verify requests.</li>
                <li>Protect against malicious attacks.</li>
                <li>Maintain account security.</li>
              </ul>
              <p>These cookies are considered essential for maintaining the integrity of the Platform.</p>

              <h2>4. Third-Party Cookies</h2>
              <p>Some cookies may be placed by trusted third-party service providers that help us operate Weave.</p>
              <p>Examples may include services related to:</p>
              <ul>
                <li>User authentication and Payment processing</li>
                <li>Analytics and Cloud hosting</li>
                <li>Customer support and Email delivery</li>
                <li>Error monitoring and Security</li>
              </ul>
              <p>These providers operate according to their own privacy and cookie policies. We encourage you to review those policies where applicable.</p>

              <h2>5. Managing Cookies</h2>
              <p>Most web browsers allow you to control cookies through their settings. Depending on your browser, you may be able to view stored cookies, delete existing cookies, block future cookies, or receive notifications before cookies are stored.</p>
              <p>Please note that disabling certain cookies may affect the functionality of Weave. Some features, including account authentication and security protections, may not operate correctly if essential cookies are disabled.</p>

              <h2>6. Cookie Consent</h2>
              <p>Where required by applicable law, Weave will request your consent before using non-essential cookies. You may update your cookie preferences at any time through our cookie banner or future cookie preference center, where available.</p>
              <p>Essential cookies remain necessary for the operation and security of the Platform and generally cannot be disabled through our services.</p>

              <h2>7. Data Collected Through Cookies</h2>
              <p>Depending on the type of cookie used, information collected may include IP address, Browser type, Device information, Operating system, Language settings, Session identifiers, Pages visited, Time spent on pages, Referring websites, and Feature interactions.</p>
              <p>For more information about how we process personal information, please refer to our Privacy Policy.</p>

              <h2>8. How Long Cookies Are Stored</h2>
              <p>Some cookies are temporary and expire automatically when you close your browser. Others remain on your device for a longer period to remember your preferences across future visits. The retention period depends on the purpose of the cookie and the settings configured by Weave or the relevant third-party provider.</p>

              <h2>9. Changes to This Cookie Policy</h2>
              <p>We may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or our services. When significant updates are made, we will revise the Effective Date and may provide additional notice through the Platform where appropriate. Your continued use of Weave after any updates become effective constitutes acceptance of the revised Cookie Policy.</p>

              <h2>10. Contact Us</h2>
              <p>If you have any questions regarding this Cookie Policy or our use of cookies, please contact us.</p>
              <p>
                <strong>Privacy:</strong> <a href="mailto:privacy@weave.com">privacy@weave.com</a><br/>
                <strong>Support:</strong> <a href="mailto:support@weave.com">support@weave.com</a>
              </p>

              <div className="bg-surface-secondary border border-border p-6 rounded-[var(--radius-card)] mt-12 text-center">
                <h3 className="text-xl font-bold text-heading mt-0 mb-3">Summary</h3>
                <p className="mb-0 text-sm leading-relaxed">
                  Cookies help Weave deliver a secure, reliable, and personalized experience. We use them responsibly to operate essential features, improve performance, understand how our Platform is used, and protect the security of our community. We remain committed to transparency about the technologies we use and the choices available to our users.
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
