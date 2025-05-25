import Link from "next/link"
import { BookOpen } from "lucide-react"

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
          </Link>
          <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-12 max-w-4xl mx-auto px-4">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">Terms of Service</h1>
            <p className="text-muted-foreground text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using EdNoteAI ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p>
                EdNoteAI is an AI-powered educational tool that provides:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Transcription services for audio and video content</li>
                <li>AI-generated academic notes and summaries</li>
                <li>LaTeX formatting for mathematical equations and scientific notation</li>
                <li>Cloud storage for your transcriptions and notes</li>
                <li>Premium subscription features for enhanced functionality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>
              <p>
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information</li>
                <li>Keep your account credentials secure and confidential</li>
                <li>Be responsible for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Subscription Plans and Billing</h2>
              <p>
                EdNoteAI offers both free and premium subscription plans:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Free Plan:</strong> Limited transcriptions and note generations per month</li>
                <li><strong>Student Plan:</strong> $9.99/month or $99.90/year with enhanced features</li>
                <li><strong>Professional Plan:</strong> $14.99/month or $149.90/year with unlimited access</li>
              </ul>
              <p className="mt-4">
                Subscription fees are billed in advance and are non-refundable except as required by law. 
                You may cancel your subscription at any time, and the cancellation will take effect at the end of your current billing period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use Policy</h2>
              <p>
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload content that violates copyright, trademark, or other intellectual property rights</li>
                <li>Upload illegal, harmful, threatening, abusive, or offensive content</li>
                <li>Upload content containing personal information of others without consent</li>
                <li>Attempt to reverse engineer, hack, or compromise the Service</li>
                <li>Use the Service for commercial purposes without proper licensing</li>
                <li>Share your account credentials with others</li>
                <li>Upload malware, viruses, or other harmful code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Content and Intellectual Property</h2>
              <p>
                You retain ownership of any content you upload to the Service. By uploading content, you grant EdNoteAI 
                a limited license to process, transcribe, and generate notes from your content solely to provide the Service to you.
              </p>
              <p className="mt-4">
                The Service, including its original content, features, and functionality, is owned by EdNoteAI and is protected 
                by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data Protection</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
                to understand our practices regarding the collection, use, and disclosure of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. AI-Generated Content Disclaimer</h2>
              <p>
                EdNoteAI uses artificial intelligence to generate transcriptions and notes. While we strive for accuracy:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>AI-generated content may contain errors or inaccuracies</li>
                <li>You should verify important information independently</li>
                <li>We do not guarantee the completeness or accuracy of AI-generated content</li>
                <li>The Service is intended for educational purposes and should not replace professional advice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Service Availability</h2>
              <p>
                We strive to maintain high service availability but do not guarantee uninterrupted access. 
                The Service may be temporarily unavailable due to maintenance, updates, or technical issues. 
                We reserve the right to modify or discontinue the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, EdNoteAI shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including without limitation, loss of profits, data, 
                use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless EdNoteAI and its affiliates from and against any 
                claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service 
                or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice, 
                for conduct that we believe violates these Terms or is harmful to other users, the Service, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be interpreted and governed by the laws of the jurisdiction in which EdNoteAI operates, 
                without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any material changes 
                via email or through the Service. Your continued use of the Service after such modifications constitutes 
                acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us through our website 
                or customer support channels.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="w-full border-t bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">EdNoteAI</span>
          </Link>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} EdNoteAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
} 