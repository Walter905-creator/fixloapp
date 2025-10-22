import { Helmet } from "react-helmet-async";

export default function Privacy() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 prose prose-invert">
      <Helmet>
        <title>Privacy Policy | Fixlo</title>
        <meta
          name="description"
          content="Privacy Policy for using Fixlo's website, marketplace, subscriptions, and services."
        />
        <link rel="canonical" href="https://www.fixloapp.com/privacy" />
      </Helmet>

      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> October 22, 2025</p>

      <h2>1. Overview</h2>
      <p>
        Welcome to Fixlo ("<strong>Fixlo</strong>," "<strong>we</strong>," "<strong>our</strong>," or "<strong>us</strong>"). 
        This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
        marketplace platform that connects homeowners ("<strong>Homeowners</strong>") with independent professionals
        ("<strong>Pros</strong>") offering home services. By accessing or using our website, applications, or any related 
        tools (the "<strong>Platform</strong>"), you acknowledge that you have read and understood this Privacy Policy.
      </p>

      <h2>2. Information We Collect</h2>
      <p>We collect several types of information from and about users of our Platform:</p>
      
      <h3>Personal Information</h3>
      <ul>
        <li>Name, email address, phone number, and postal address</li>
        <li>Date of birth (for age verification and background checks)</li>
        <li>Government-issued identification numbers (for verification purposes)</li>
        <li>Profile photos and other uploaded content</li>
      </ul>

      <h3>Professional Information (for Pros)</h3>
      <ul>
        <li>Trade specialties, certifications, and licenses</li>
        <li>Business information and service areas</li>
        <li>Background check results and screening data (via Checkr)</li>
        <li>Work history and professional references</li>
      </ul>

      <h3>Device and Usage Information</h3>
      <ul>
        <li>Device identifiers, IP addresses, and browser information</li>
        <li>Platform usage patterns and interaction data</li>
        <li>Location data (with your permission)</li>
        <li>Cookies and similar tracking technologies</li>
      </ul>

      <h3>Payment Information</h3>
      <ul>
        <li>Payment method details (processed securely by Stripe)</li>
        <li>Billing addresses and transaction history</li>
        <li>Subscription and payment preferences</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use the information we collect for the following purposes:</p>
      <ul>
        <li><strong>Service Matching:</strong> Connect Homeowners with qualified Pros in their area</li>
        <li><strong>Platform Operations:</strong> Provide, maintain, and improve our services</li>
        <li><strong>Communication:</strong> Send service updates, job notifications, and platform announcements</li>
        <li><strong>Payment Processing:</strong> Handle subscriptions, payments, and billing through Stripe</li>
        <li><strong>Safety & Security:</strong> Conduct background checks and verify user identities</li>
        <li><strong>Customer Support:</strong> Respond to inquiries and provide assistance</li>
        <li><strong>Legal Compliance:</strong> Meet legal obligations and enforce our Terms</li>
        <li><strong>Analytics:</strong> Analyze usage patterns to improve user experience</li>
      </ul>

      <h2>4. Information Sharing</h2>
      <p>We do not sell, rent, or trade your personal information. We may share your information in the following circumstances:</p>
      
      <h3>Service Providers</h3>
      <ul>
        <li><strong>Stripe:</strong> Payment processing and subscription management</li>
        <li><strong>Checkr:</strong> Background checks and identity verification for Pros</li>
        <li><strong>Twilio:</strong> SMS communications and notifications</li>
        <li><strong>Cloud Providers:</strong> Data hosting and storage services</li>
      </ul>

      <h3>Platform Users</h3>
      <ul>
        <li>When Homeowners submit service requests, relevant information is shared with matching Pros</li>
        <li>Pro profiles and basic information are visible to potential customers</li>
        <li>Reviews and ratings may be publicly displayed</li>
      </ul>

      <h3>Legal Requirements</h3>
      <ul>
        <li>When required by law, court order, or government request</li>
        <li>To protect our rights, property, or safety, or that of our users</li>
        <li>In connection with legal proceedings or investigations</li>
      </ul>

      <h2>5. SMS & Communication Consent</h2>
      <p>
        By providing your phone number and opting in, you consent to receive SMS messages from Fixlo regarding:
      </p>
      <ul>
        <li>Job leads and service request notifications</li>
        <li>Account updates and important platform announcements</li>
        <li>Payment confirmations and subscription information</li>
        <li>Customer support communications</li>
      </ul>
      <p>
        Message frequency varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt out, or 
        <strong>HELP</strong> for help. Consent is not a condition of using our services.
      </p>

      <h2>6. Data Retention & Deletion</h2>
      <p>
        We retain your personal information for as long as necessary to provide our services and comply with legal obligations:
      </p>
      <ul>
        <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
        <li><strong>Inactive Accounts:</strong> Data may be retained for up to 7 years after account closure</li>
        <li><strong>Financial Records:</strong> Payment and billing information retained as required by law</li>
        <li><strong>Safety Records:</strong> Background check data retained for regulatory compliance</li>
      </ul>
      <p>
        You may request deletion of your personal information by contacting us at 
        <a href="mailto:pro4u.improvements@gmail.com">pro4u.improvements@gmail.com</a>. We will respond within 30 days.
      </p>

      <h2>7. Security Measures</h2>
      <p>
        We implement appropriate technical and organizational security measures to protect your personal information:
      </p>
      <ul>
        <li>Data encryption in transit and at rest</li>
        <li>Secure servers and access controls</li>
        <li>Regular security audits and vulnerability assessments</li>
        <li>Employee training on data protection practices</li>
        <li>Incident response and breach notification procedures</li>
      </ul>
      <p>
        However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to 
        protect your personal information, we cannot guarantee absolute security.
      </p>

      <h2>8. Children's Privacy</h2>
      <p>
        Our Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal 
        information from children under 18. If you are a parent or guardian and believe your child has provided us 
        with personal information, please contact us immediately so we can delete such information.
      </p>

      <h2>9. Your Rights</h2>
      <p>Depending on your location, you may have the following rights regarding your personal information:</p>
      <ul>
        <li><strong>Access:</strong> Request copies of your personal information</li>
        <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
        <li><strong>Deletion:</strong> Request deletion of your personal information</li>
        <li><strong>Portability:</strong> Request transfer of your data to another service</li>
        <li><strong>Restriction:</strong> Request limitation of how we process your information</li>
        <li><strong>Objection:</strong> Object to certain types of processing</li>
        <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
      </ul>
      <p>
        To exercise these rights, contact us at <a href="mailto:pro4u.improvements@gmail.com">pro4u.improvements@gmail.com</a>.
      </p>

      <h2>10. International Data Transfers</h2>
      <p>
        Your information may be transferred to and processed in countries other than your country of residence. 
        We ensure that such transfers are made in accordance with applicable privacy laws and that appropriate 
        safeguards are in place to protect your information.
      </p>

      <h2>11. Background Checks</h2>
      <p>
        For safety and quality assurance, Pros may undergo background checks through our partner Checkr. This process may include:
      </p>
      <ul>
        <li>Identity verification and SSN validation</li>
        <li>Criminal history searches at county, state, and federal levels</li>
        <li>Sex offender registry checks</li>
        <li>Professional license verification</li>
      </ul>
      <p>
        Background check information is handled in accordance with the Fair Credit Reporting Act (FCRA) and applicable state laws.
      </p>

      <h2>12. Payment Processing</h2>
      <p>
        All payment transactions are processed securely through Stripe, our payment processor. We do not store your 
        complete payment card information on our servers. Stripe maintains PCI DSS Level 1 compliance and employs 
        industry-standard security measures to protect payment data.
      </p>

      <h2>13. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. 
        The "Last updated" date above indicates when this Privacy Policy was last revised. Material changes will be 
        posted on our Platform and may be communicated via email or SMS. Your continued use of our services after 
        changes are posted constitutes acceptance of the updated Privacy Policy.
      </p>

      <h2>14. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or our privacy practices, please contact us at:
      </p>
      <p>
        Email: <a href="mailto:pro4u.improvements@gmail.com">pro4u.improvements@gmail.com</a><br />
        We will respond to privacy-related inquiries within 30 days.
      </p>
    </main>
  );
}