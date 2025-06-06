import Link from "next/link"
import { BookOpen } from "lucide-react"

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl font-bold tracking-tighter mb-4">PRIVACY POLICY</h1>
            <p className="text-muted-foreground text-lg">
              Last updated May 28, 2025
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <p>
                This Privacy Policy for <strong>EdNoteAI</strong> (<strong>we,</strong> <strong>us,</strong> or <strong>our</strong>) describes how and why we might access, collect, store, use, and/or share (<strong>process</strong>) your personal information when you use our services (<strong>Services</strong>), including when you:
              </p>
              <p className="mt-4">
                <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">SUMMARY OF KEY POINTS</h2>
              <p className="italic mb-4">
                <em>This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.</em>
              </p>
              <p>
                <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about personal information you disclose to us.
              </p>
              <p className="mt-4">
                <strong>Do we process any sensitive personal information?</strong> Some of the information may be considered &quot;special&quot; or &quot;sensitive&quot; in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We do not process sensitive personal information.
              </p>
              <p className="mt-4">
                <strong>Do we collect any information from third parties?</strong> We may collect information from public databases, marketing partners, social media platforms, and other outside sources. Learn more about information collected from other sources.
              </p>
              <p className="mt-4">
                <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more about how we process your information.
              </p>
              <p className="mt-4">
                <strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties. Learn more about when and with whom we share your personal information.
              </p>
              <p className="mt-4">
                <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Learn more about your privacy rights.
              </p>
              <p className="mt-4">
                <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.
              </p>
              <p className="mt-4">
                Want to learn more about what we do with any information we collect? Review the Privacy Notice in full.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">TABLE OF CONTENTS</h2>
              <ol className="list-decimal pl-6 space-y-1">
                <li><a href="#what-information-do-we-collect" className="text-primary hover:underline">WHAT INFORMATION DO WE COLLECT?</a></li>
                <li><a href="#how-do-we-process-your-information" className="text-primary hover:underline">HOW DO WE PROCESS YOUR INFORMATION?</a></li>
                <li><a href="#when-and-with-whom-do-we-share-your-personal-information" className="text-primary hover:underline">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></li>
                <li><a href="#do-we-use-cookies-and-other-tracking-technologies" className="text-primary hover:underline">DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</a></li>
                <li><a href="#how-do-we-handle-your-social-logins" className="text-primary hover:underline">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a></li>
                <li><a href="#is-your-information-transferred-internationally" className="text-primary hover:underline">IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</a></li>
                <li><a href="#how-long-do-we-keep-your-information" className="text-primary hover:underline">HOW LONG DO WE KEEP YOUR INFORMATION?</a></li>
                <li><a href="#do-we-collect-information-from-minors" className="text-primary hover:underline">DO WE COLLECT INFORMATION FROM MINORS?</a></li>
                <li><a href="#what-are-your-privacy-rights" className="text-primary hover:underline">WHAT ARE YOUR PRIVACY RIGHTS?</a></li>
                <li><a href="#controls-for-do-not-track-features" className="text-primary hover:underline">CONTROLS FOR DO-NOT-TRACK FEATURES</a></li>
                <li><a href="#do-we-make-updates-to-this-notice" className="text-primary hover:underline">DO WE MAKE UPDATES TO THIS NOTICE?</a></li>
                <li><a href="#how-can-you-contact-us-about-this-notice" className="text-primary hover:underline">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></li>
                <li><a href="#how-can-you-review-update-or-delete-the-data-we-collect-from-you" className="text-primary hover:underline">HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></li>
              </ol>
            </section>

            <section id="what-information-do-we-collect">
              <h2 className="text-2xl font-semibold mb-4">1. WHAT INFORMATION DO WE COLLECT?</h2>
              
              <h3 className="text-lg font-semibold mb-2">Personal information you disclose to us</h3>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> We collect personal information that you provide to us.</em>
              </p>
              <p>
                We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
              </p>
              <p className="mt-4">
                <strong>Sensitive Information.</strong> We do not process sensitive information.
              </p>
              <p className="mt-4">
                All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-6">Information automatically collected</h3>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</em>
              </p>
              <p>
                We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.
              </p>
              <p className="mt-4">
                Like many businesses, we also collect information through cookies and similar technologies.
              </p>
            </section>

            <section id="how-do-we-process-your-information">
              <h2 className="text-2xl font-semibold mb-4">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</em>
              </p>
              <p>
                We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
              </p>
            </section>

            <section id="when-and-with-whom-do-we-share-your-personal-information">
              <h2 className="text-2xl font-semibold mb-4">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following third parties.</em>
              </p>
              <p>
                We may need to share your personal information in the following situations:
              </p>
              <p className="mt-4">
                <strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
              </p>
              <p className="mt-4">
                <strong>Affiliates.</strong> We may share your information with our affiliates, in which case we will require those affiliates to honor this Privacy Notice. Affiliates include our parent company and any subsidiaries, joint venture partners, or other companies that we control or that are under common control with us.
              </p>
              <p className="mt-4">
                <strong>Business Partners.</strong> We may share your information with our business partners to offer you certain products, services, or promotions.
              </p>
            </section>

            <section id="do-we-use-cookies-and-other-tracking-technologies">
              <h2 className="text-2xl font-semibold mb-4">4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> We may use cookies and other tracking technologies to collect and store your information.</em>
              </p>
              <p>
                We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.
              </p>
              <p className="mt-4">
                We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.
              </p>
              <p className="mt-4">
                Specific information about how we use such technologies and how you can refuse certain cookies is set out in our <Link href="/cookies" className="text-primary hover:underline font-medium">Cookies Policy</Link>.
              </p>
            </section>

            <section id="how-do-we-handle-your-social-logins">
              <h2 className="text-2xl font-semibold mb-4">5. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</em>
              </p>
              <p>
                Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.
              </p>
              <p className="mt-4">
                We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.
              </p>
            </section>

            <section id="is-your-information-transferred-internationally">
              <h2 className="text-2xl font-semibold mb-4">6. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h2>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> We may transfer, store, and process your information in countries other than your own.</em>
              </p>
              <p>
                Our servers are located in [location]. If you are accessing our Services from outside [location], please be aware that your information may be transferred to, stored by, and processed by us in our facilities and in the facilities of the third parties with whom we may share your personal information (see &quot;WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?&quot; above), in [location] and other countries.
              </p>
              <p className="mt-4">
                If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this Privacy Notice and applicable law.
              </p>
            </section>

            <section id="how-long-do-we-keep-your-information">
              <h2 className="text-2xl font-semibold mb-4">7. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</em>
              </p>
              <p>
                We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).
              </p>
              <p className="mt-4">
                When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
              </p>
            </section>

            <section id="do-we-collect-information-from-minors">
              <h2 className="text-2xl font-semibold mb-4">8. DO WE COLLECT INFORMATION FROM MINORS?</h2>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> We do not knowingly collect data from or market to children under 18 years of age.</em>
              </p>
              <p>
                We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent&apos;s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at support@ednoteai.com.
              </p>
            </section>

            <section id="what-are-your-privacy-rights">
              <h2 className="text-2xl font-semibold mb-4">9. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</em>
              </p>
              <p>
                <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section &quot;HOW CAN YOU CONTACT US ABOUT THIS NOTICE?&quot; below.
              </p>
              <p className="mt-4">
                However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-6">Account Information</h3>
              <p>
                If you would at any time like to review or change the information in your account or terminate your account, you can:
              </p>
              <p className="mt-4">
                Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
              </p>
            </section>

            <section id="controls-for-do-not-track-features">
              <h2 className="text-2xl font-semibold mb-4">10. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
              <p>
                Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&quot;DNT&quot;) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
              </p>
            </section>

            <section id="do-we-make-updates-to-this-notice">
              <h2 className="text-2xl font-semibold mb-4">11. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
              <p className="italic mb-2">
                <em><strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.</em>
              </p>
              <p>
                We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
              </p>
            </section>

            <section id="how-can-you-contact-us-about-this-notice">
              <h2 className="text-2xl font-semibold mb-4">12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
              <p>
                If you have questions or comments about this notice, you may contact us at support@ednoteai.com.
              </p>
            </section>

            <section id="how-can-you-review-update-or-delete-the-data-we-collect-from-you">
              <h2 className="text-2xl font-semibold mb-4">13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
              <p>
                Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.
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
            <Link href="/terms" className="hover:underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:underline underline-offset-4">
              Privacy Policy
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