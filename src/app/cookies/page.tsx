import Link from "next/link"
import { BookOpen } from "lucide-react"

export default function CookiesPolicy() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
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

      <main className="flex-1 container mx-auto py-12 max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter mb-4">COOKIES POLICY</h1>
            <p className="text-muted-foreground text-lg">
              Last updated May 28, 2025
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">WHAT ARE COOKIES?</h2>
              <p>
                Cookies are small text files that are placed on your computer or mobile device when you visit our website. They are widely used to make websites work more efficiently and to provide information to website owners.
              </p>
              <p className="mt-4">
                EdNoteAI uses cookies and similar tracking technologies to enhance your experience, maintain security, and provide our services effectively. This Cookies Policy explains what cookies we use, why we use them, and how you can manage your cookie preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">TABLE OF CONTENTS</h2>
              <ol className="list-decimal pl-6 space-y-1">
                <li><a href="#what-are-cookies" className="text-primary hover:underline">What are cookies?</a></li>
                <li><a href="#types-of-cookies" className="text-primary hover:underline">Types of cookies we use</a></li>
                <li><a href="#essential-cookies" className="text-primary hover:underline">Essential cookies</a></li>
                <li><a href="#functional-cookies" className="text-primary hover:underline">Functional cookies</a></li>
                <li><a href="#analytics-cookies" className="text-primary hover:underline">Analytics cookies</a></li>
                <li><a href="#third-party-cookies" className="text-primary hover:underline">Third-party cookies</a></li>
                <li><a href="#managing-cookies" className="text-primary hover:underline">Managing your cookie preferences</a></li>
                <li><a href="#cookie-changes" className="text-primary hover:underline">Changes to this policy</a></li>
                <li><a href="#contact-cookies" className="text-primary hover:underline">Contact us</a></li>
              </ol>
            </section>

            <section id="types-of-cookies">
              <h2 className="text-2xl font-semibold mb-4">TYPES OF COOKIES WE USE</h2>
              <p>
                We use different types of cookies for various purposes. Below is a detailed explanation of each category:
              </p>
            </section>

            <section id="essential-cookies">
              <h2 className="text-2xl font-semibold mb-4">1. ESSENTIAL COOKIES</h2>
              <p>
                <strong>Purpose:</strong> These cookies are strictly necessary for the operation of our website and cannot be switched off in our systems.
              </p>
              
              <h3 className="text-lg font-semibold mb-2 mt-4">Authentication Cookies</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Supabase Authentication Cookies:</strong> These cookies store your authentication session information, allowing you to remain logged in while using EdNoteAI. They include:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><code>sb-access-token</code> - Stores your authentication token</li>
                    <li><code>sb-refresh-token</code> - Enables automatic session renewal</li>
                    <li><code>supabase-auth-token</code> - Maintains your login state</li>
                  </ul>
                </li>
                <li><strong>Session Management:</strong> Cookies that track your current session state and ensure secure access to your account and uploaded content.</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Security Cookies</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>CSRF Protection:</strong> Cookies that prevent cross-site request forgery attacks and protect your account security.</li>
                <li><strong>Form Protection:</strong> Cookies that validate form submissions and prevent unauthorized access attempts.</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Legal Basis</h3>
              <p>
                These cookies are processed based on our legitimate interest in providing secure, functional services and are essential for the performance of our contract with you.
              </p>
            </section>

            <section id="functional-cookies">
              <h2 className="text-2xl font-semibold mb-4">2. FUNCTIONAL COOKIES</h2>
              <p>
                <strong>Purpose:</strong> These cookies enable enhanced functionality and personalization of our website.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">User Preferences</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Theme Preferences:</strong> Remember your dark/light mode settings</li>
                <li><strong>Language Settings:</strong> Store your preferred language (if applicable)</li>
                <li><strong>Upload Preferences:</strong> Remember your lesson selection and note format preferences</li>
                <li><strong>Interface Settings:</strong> Save your preferred view modes (grid/list) in the library</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Application State</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Progress Tracking:</strong> Maintain state during file uploads and processing</li>
                <li><strong>Navigation State:</strong> Remember your last visited pages within the dashboard</li>
                <li><strong>Form Data:</strong> Temporarily store form information to prevent data loss during navigation</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Legal Basis</h3>
              <p>
                These cookies are processed based on your consent and our legitimate interest in improving user experience.
              </p>
            </section>

            <section id="analytics-cookies">
              <h2 className="text-2xl font-semibold mb-4">3. ANALYTICS COOKIES</h2>
              <p>
                <strong>Purpose:</strong> These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">Usage Analytics</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Page Views:</strong> Track which pages are visited most frequently</li>
                <li><strong>Feature Usage:</strong> Monitor how users interact with our AI note generation features</li>
                <li><strong>Performance Metrics:</strong> Measure upload success rates, processing times, and error rates</li>
                <li><strong>User Journey:</strong> Understand how users navigate through our application</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Error Tracking</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Error Logging:</strong> Collect information about technical errors to improve our service</li>
                <li><strong>Performance Monitoring:</strong> Track application performance and identify bottlenecks</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Legal Basis</h3>
              <p>
                These cookies are processed based on your consent and our legitimate interest in improving our services and user experience.
              </p>
            </section>

            <section id="third-party-cookies">
              <h2 className="text-2xl font-semibold mb-4">4. THIRD-PARTY COOKIES</h2>
              <p>
                <strong>Purpose:</strong> Some cookies on our site are set by third-party services that we use to enhance functionality.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">Authentication Services</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Supabase:</strong> Our authentication and database provider sets cookies to:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Manage user authentication sessions</li>
                    <li>Enable secure API communications</li>
                    <li>Provide real-time updates for note processing</li>
                  </ul>
                </li>
                <li>
                  <strong>Social Login Providers:</strong> When you use social login options, providers like Google may set their own cookies according to their privacy policies.
                </li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Cloud Services</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>AWS Services:</strong> Cookies related to our cloud infrastructure for:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>File upload and storage (S3)</li>
                    <li>Audio/video processing (Lambda)</li>
                    <li>Content delivery and caching</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">AI Services</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>OpenAI API:</strong> Cookies that may be set during API communications for:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Speech-to-text transcription (Whisper)</li>
                    <li>AI-powered note generation (GPT models)</li>
                    <li>Rate limiting and usage tracking</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Legal Basis</h3>
              <p>
                Third-party cookies are processed based on your consent and the legitimate interests of both EdNoteAI and our service providers in delivering reliable, secure services.
              </p>
            </section>

            <section id="managing-cookies">
              <h2 className="text-2xl font-semibold mb-4">5. MANAGING YOUR COOKIE PREFERENCES</h2>
              
              <h3 className="text-lg font-semibold mb-2">Browser Settings</h3>
              <p>
                You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit our site, and some services and functionalities may not work.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">Browser-Specific Instructions</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Impact of Disabling Cookies</h3>
              <p>
                Please note that disabling certain cookies may impact your ability to use EdNoteAI:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Essential Cookies:</strong> Disabling these will prevent you from logging in and using our services</li>
                <li><strong>Functional Cookies:</strong> Your preferences and settings will not be saved</li>
                <li><strong>Analytics Cookies:</strong> We won't be able to improve our services based on usage patterns</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">Opt-Out Options</h3>
              <p>
                For analytics and third-party cookies, you can opt out through:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Your browser's "Do Not Track" setting</li>
                <li>Individual third-party provider opt-out mechanisms</li>
                <li>Industry-wide opt-out tools</li>
              </ul>
            </section>

            <section id="cookie-changes">
              <h2 className="text-2xl font-semibold mb-4">6. CHANGES TO THIS COOKIES POLICY</h2>
              <p>
                We may update this Cookies Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Posting the updated policy on this page with a new "Last updated" date</li>
                <li>Sending you an email notification if you have an account with us</li>
                <li>Displaying a prominent notice on our website</li>
              </ul>
              <p className="mt-4">
                We encourage you to review this Cookies Policy periodically to stay informed about how we use cookies.
              </p>
            </section>

            <section id="contact-cookies">
              <h2 className="text-2xl font-semibold mb-4">7. CONTACT US</h2>
              <p>
                If you have any questions about our use of cookies or this Cookies Policy, please contact us:
              </p>
              <div className="mt-4">
                <p><strong>EdNoteAI</strong></p>
                <p>Chicago, IL 60640</p>
                <p>United States</p>
                <p>Email: support@ednoteai.com</p>
              </div>
              <p className="mt-4">
                We are committed to protecting your privacy and will respond to your inquiries promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">YOUR RIGHTS</h2>
              <p>
                Under applicable privacy laws, you may have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Access information about the cookies we use</li>
                <li>Withdraw your consent for non-essential cookies</li>
                <li>Request deletion of cookies and related data</li>
                <li>Object to processing based on legitimate interests</li>
                <li>Lodge a complaint with supervisory authorities</li>
              </ul>
              <p className="mt-4">
                To exercise these rights or for more information, please contact us using the details provided above.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="w-full border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 px-4 sm:px-6 lg:px-8 md:h-24 md:flex-row md:py-0">
          <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">EdNoteAI</span>
            <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
              BETA
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline underline-offset-4">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:underline underline-offset-4">
              Cookies Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
} 