import React from "react";
import { Helmet } from "react-helmet-async";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Terms of Service - Fixlo</title>
        <meta 
          name="description" 
          content="Terms of service for Fixlo home services marketplace. User responsibilities, payment terms, dispute resolution, and legal information." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/terms" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Services</h2>
            <p className="text-gray-700 mb-4">
              Fixlo operates a digital marketplace connecting homeowners with verified home service professionals. 
              Our platform facilitates connections for services including but not limited to plumbing, electrical work, 
              HVAC, carpentry, painting, roofing, house cleaning, junk removal, and landscaping.
            </p>
            <p className="text-gray-700">
              Fixlo acts as an intermediary and is not directly providing the home services. All services are 
              performed by independent contractors who use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Responsibilities</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Homeowners</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Provide accurate information about service needs</li>
              <li>Ensure safe access to work areas</li>
              <li>Communicate clearly with service professionals</li>
              <li>Pay for services as agreed upon</li>
              <li>Report any issues promptly through our platform</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Service Professionals</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Maintain valid licenses and insurance as required by law</li>
              <li>Provide services with professional competence</li>
              <li>Respond to customer inquiries in a timely manner</li>
              <li>Complete work as specified in agreements</li>
              <li>Follow all applicable safety regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Payment Terms</h2>
            <p className="text-gray-700 mb-4">
              Payments are processed securely through our platform using Stripe payment processing. 
              Service professionals receive payment upon completion of work, minus applicable platform fees.
            </p>
            <p className="text-gray-700 mb-4">
              Professional subscription fees of $59.99/month are billed automatically and provide access 
              to our full platform features including job notifications, customer communication tools, 
              and business management features.
            </p>
            <p className="text-gray-700">
              All payments are final unless otherwise specified. Refunds may be available in cases of 
              service disputes resolved in favor of the customer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Dispute Process</h2>
            <p className="text-gray-700 mb-4">
              If you experience issues with a service, please contact us immediately at pro4u.improvements@gmail.com. 
              We will work to resolve disputes fairly and efficiently.
            </p>
            <p className="text-gray-700 mb-4">
              Our dispute resolution process includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Initial review and mediation by our support team</li>
              <li>Communication between all parties to reach resolution</li>
              <li>Escalation to senior management if needed</li>
              <li>Final determination based on platform policies and applicable law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Termination</h2>
            <p className="text-gray-700 mb-4">
              Either party may terminate their account at any time. Professional subscriptions will continue 
              until the end of the current billing period. We reserve the right to suspend or terminate 
              accounts for violations of these terms.
            </p>
            <p className="text-gray-700">
              Upon termination, you retain access to historical transaction data but lose access to active 
              platform features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Governing Law</h2>
            <p className="text-gray-700">
              These terms are governed by the laws of the United States and the state where Fixlo is incorporated. 
              Any disputes will be resolved in the appropriate courts of that jurisdiction. By using our platform, 
              you agree to these terms and to resolve disputes according to this framework.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700">
              For questions about these terms, please contact us at pro4u.improvements@gmail.com or through 
              our support system.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}