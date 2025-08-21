import React from "react";
import { Helmet } from "react-helmet-async";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Privacy Policy - Fixlo</title>
        <meta 
          name="description" 
          content="Fixlo privacy policy covering data collection, cookies, processing, retention, third-party services, and user rights." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/privacy" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Account Information</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Name, email address, and phone number</li>
              <li>Professional credentials and licenses (for service providers)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Profile photos and business information</li>
              <li>Service history and ratings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Device and Usage Data</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>IP address and browser information</li>
              <li>Device type and operating system</li>
              <li>Pages visited and features used</li>
              <li>Time spent on platform and interaction patterns</li>
              <li>Location data (with your permission)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Communication Data</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Messages between homeowners and professionals</li>
              <li>Support tickets and correspondence</li>
              <li>SMS notifications and preferences</li>
              <li>Photo uploads related to service requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to improve your experience on our platform:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Essential Cookies:</strong> Required for platform functionality and security</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Marketing Cookies:</strong> Used to provide relevant advertisements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-4">We process your data based on:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Contractual Necessity:</strong> To provide our marketplace services</li>
              <li><strong>Legitimate Interests:</strong> To improve our platform and prevent fraud</li>
              <li><strong>Consent:</strong> For marketing communications and optional features</li>
              <li><strong>Legal Obligations:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your data for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Account data: Until account deletion plus 7 years for legal compliance</li>
              <li>Transaction records: 7 years from transaction date</li>
              <li>Communication logs: 3 years from last interaction</li>
              <li>Analytics data: Anonymized after 26 months</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              We work with trusted third-party services to provide our platform:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Payment Processing</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Stripe:</strong> Secure payment processing and subscription management</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Communication Services</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Twilio:</strong> SMS notifications and phone verification</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">File Storage</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Cloudinary:</strong> Image upload, processing, and storage</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">Analytics and Monitoring</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Vercel Analytics:</strong> Website performance and usage analytics</li>
              <li><strong>MongoDB Atlas:</strong> Secure database hosting</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain types of processing</li>
              <li><strong>Restriction:</strong> Request limitation of processing in certain cases</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement comprehensive security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Encryption in transit and at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication requirements</li>
              <li>Monitoring and incident response procedures</li>
              <li>Staff training on data protection best practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For privacy-related questions or to exercise your rights, please contact us:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Email: pro4u.improvements@gmail.com</li>
              <li>Subject: Privacy Policy Inquiry</li>
              <li>Response time: Within 30 days of receipt</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}