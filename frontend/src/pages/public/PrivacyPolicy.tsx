import { motion } from "motion/react";
import { PageHeader } from "@/components/shared/PageHeader";

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader title="Privacy Policy" description="Last updated: April 6, 2026" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="prose prose-sm sm:prose dark:prose-invert max-w-none"
      >
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pharos ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you visit our
            website and use our services. We operate as a 501(c)(3) nonprofit organization supporting
            safehouses for girls who are survivors of abuse and trafficking in the Philippines.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
          <h3 className="text-lg font-medium mt-4 mb-2">Personal Information</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">When you create an account, donate, or contact us, we may collect:</p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc pl-5">
            <li>Name and display name</li>
            <li>Email address</li>
            <li>Phone number (optional)</li>
            <li>Organization name (if applicable)</li>
            <li>Donation history and amounts</li>
            <li>Account credentials (stored securely with hashing)</li>
          </ul>

          <h3 className="text-lg font-medium mt-4 mb-2">Automatically Collected Information</h3>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc pl-5">
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>IP address</li>
            <li>Pages visited and time spent</li>
            <li>Referring website</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">We use collected information to:</p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc pl-5">
            <li>Process donations and provide tax receipts</li>
            <li>Provide personalized impact reports showing how your contributions help</li>
            <li>Communicate updates about our programs and campaigns</li>
            <li>Improve our website and services</li>
            <li>Ensure security and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Cookies and Tracking</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">We use the following types of cookies:</p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc pl-5">
            <li><strong>Essential cookies:</strong> Required for authentication and basic site functionality. These cannot be disabled.</li>
            <li><strong>Preference cookies:</strong> Store your settings such as theme preference (light/dark mode). The theme cookie (<code>pharos_theme</code>) is browser-accessible.</li>
            <li><strong>Analytics cookies:</strong> Help us understand site usage patterns. You can opt out via our cookie consent banner.</li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground mt-2">
            You can manage your cookie preferences at any time through the cookie consent banner or by
            adjusting your browser settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">We may use the following third-party services:</p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc pl-5">
            <li><strong>Google OAuth:</strong> For account authentication. Google's privacy policy applies to data processed by Google.</li>
            <li><strong>Microsoft Azure:</strong> Cloud hosting and database services. Data is stored in secure Azure data centers.</li>
            <li><strong>Social media platforms:</strong> For outreach and engagement. Each platform's privacy policy governs interactions on their sites.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We implement appropriate security measures to protect your information:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc pl-5">
            <li>HTTPS/TLS encryption for all data in transit</li>
            <li>Secure password hashing (no plaintext storage)</li>
            <li>HTTP-only, Secure, SameSite cookies for authentication</li>
            <li>Content Security Policy headers to prevent XSS attacks</li>
            <li>Role-based access control limiting data access</li>
            <li>Multi-factor authentication available for all accounts</li>
            <li>Regular security assessments</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We retain personal data only as long as necessary for the purposes described in this policy.
            Donation records are retained as required by tax regulations. You may request deletion of your
            account and personal data at any time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">You have the right to:</p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2 list-disc pl-5">
            <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Restrict processing:</strong> Limit how we use your data</li>
            <li><strong>Object:</strong> Object to processing for marketing purposes</li>
            <li><strong>Withdraw consent:</strong> Withdraw previously given consent at any time</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Our public website does not knowingly collect personal data from children under 13.
            All resident data in our case management system is protected under strict access controls
            and is only accessible to authorized staff members. Resident information is never displayed
            publicly in an identifiable form.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of any material
            changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If you have questions about this Privacy Policy or wish to exercise your rights, contact us at:
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Pharos</p>
            <p>Email: privacy@pharos.org</p>
            <p>Phone: +63 912 345 6789</p>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
