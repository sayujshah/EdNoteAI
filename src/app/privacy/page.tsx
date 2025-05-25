import Link from "next/link"
import { BookOpen } from "lucide-react"

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
            <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
              BETA
            </span>
          </Link>
          <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-12 max-w-4xl mx-auto px-4">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                EdNoteAI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we 
                collect, use, disclose, and safeguard your information when you use our AI-powered transcription and note-taking service.
              </p>
              <p className="mt-4">
                By using EdNoteAI, you consent to the data practices described in this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
                <li><strong>Payment Information:</strong> Billing information processed securely through Stripe (we do not store credit card details)</li>
                <li><strong>Content:</strong> Audio and video files you upload for transcription and note generation</li>
                <li><strong>Communications:</strong> Messages you send to our support team</li>
              </ul>

              <h3 className="text-xl font-medium mb-3 mt-6">2.2 Information We Collect Automatically</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> How you interact with our service, features used, and time spent</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers</li>
                <li><strong>Log Data:</strong> Server logs including access times, pages viewed, and system activity</li>
                <li><strong>Cookies:</strong> Small data files stored on your device to enhance your experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our transcription and note-taking services</li>
                <li>Process your uploaded content using AI to generate transcriptions and notes</li>
                <li>Manage your account and subscription billing</li>
                <li>Send you important service updates and notifications</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Analyze usage patterns to improve our AI models and service quality</li>
                <li>Prevent fraud, abuse, and ensure security of our platform</li>
                <li>Comply with legal obligations and enforce our Terms of Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. AI Processing and Content Handling</h2>
              <p>
                <strong>Your uploaded content is processed by our AI systems to provide transcription and note-taking services:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Content is processed using secure cloud-based AI models</li>
                <li>We may use your content to improve our AI models, but only in aggregated, anonymized form</li>
                <li>Your original files and generated content are stored securely and associated with your account</li>
                <li>We do not use your content for training third-party AI models without your explicit consent</li>
                <li>Content processing may involve temporary storage on secure servers during transcription</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Information Sharing and Disclosure</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> Trusted third parties who assist in operating our service (e.g., cloud hosting, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request</li>
                <li><strong>Safety and Security:</strong> To protect the rights, property, or safety of EdNoteAI, our users, or others</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of business assets</li>
                <li><strong>Consent:</strong> When you provide explicit consent for sharing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure cloud infrastructure with access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Employee training on data protection and privacy</li>
                <li>Incident response procedures for potential security breaches</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. 
                While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
              <p>
                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Data:</strong> Retained while your account is active and for a reasonable period after deactivation</li>
                <li><strong>Content:</strong> Your uploaded files and generated notes are retained as long as you maintain your account</li>
                <li><strong>Usage Data:</strong> Aggregated usage statistics may be retained indefinitely for service improvement</li>
                <li><strong>Legal Requirements:</strong> Some data may be retained longer to comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Your Rights and Choices</h2>
              <p>
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request access to your personal information we hold</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
                <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information provided in the Contact section.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Necessary for basic service functionality</li>
                <li><strong>Performance Cookies:</strong> Help us understand how you use our service</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings, but disabling certain cookies may affect service functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services</h2>
              <p>
                Our service integrates with third-party providers:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> For secure payment processing (subject to Stripe's privacy policy)</li>
                <li><strong>Cloud Providers:</strong> For hosting and storage (with appropriate data protection agreements)</li>
                <li><strong>AI Services:</strong> For transcription and note generation (with privacy safeguards)</li>
              </ul>
              <p className="mt-4">
                These third parties have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. 
                When we transfer personal information internationally, we ensure appropriate safeguards are in place 
                to protect your information in accordance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Children's Privacy</h2>
              <p>
                EdNoteAI is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If we become aware that we have collected 
                personal information from a child under 13, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting the updated Privacy Policy on our website</li>
                <li>Sending you an email notification</li>
                <li>Providing an in-service notification</li>
              </ul>
              <p className="mt-4">
                Your continued use of the service after any changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Through our website contact form</li>
                <li>Via our customer support channels</li>
                <li>By email (contact information available on our website)</li>
              </ul>
              <p className="mt-4">
                We will respond to your inquiries and requests in accordance with applicable data protection laws.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="w-full border-t bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">EdNoteAI</span>
            <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
              BETA
            </span>
          </Link>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} EdNoteAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
} 