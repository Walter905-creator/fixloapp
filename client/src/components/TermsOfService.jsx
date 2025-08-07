import React from 'react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Fixlo. These Terms of Service ("Terms") govern your use of our platform, 
              which connects homeowners with verified professionals for home improvement and maintenance 
              services. By using our service, you agree to these Terms.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Fixlo provides a platform that:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Connects homeowners with verified professionals</li>
              <li>Facilitates service requests and communications</li>
              <li>Provides subscription services for professionals</li>
              <li>Offers AI-powered home improvement guidance</li>
              <li>Enables real-time chat and SMS notifications</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <h3 className="text-lg font-medium text-gray-900 mb-2">For Homeowners:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Free to request services</li>
              <li>Must provide accurate contact information</li>
              <li>Responsible for communicating project details clearly</li>
            </ul>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">For Professionals:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Must be 18 years or older</li>
              <li>Required to pass background checks</li>
              <li>Subscription required to receive job leads</li>
              <li>Must maintain professional licensing and insurance</li>
              <li>Responsible for providing quality work and customer service</li>
            </ul>
          </section>

          {/* Subscription Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Professional subscriptions are billed monthly through Stripe:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Subscriptions automatically renew monthly</li>
              <li>Cancellation can be done at any time</li>
              <li>No refunds for partial months</li>
              <li>Failed payments may result in service suspension</li>
              <li>Subscription required to receive job notifications</li>
            </ul>
          </section>

          {/* Background Checks */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Background Checks</h2>
            <p className="text-gray-700 leading-relaxed">
              All professionals undergo background checks through Checkr. This includes criminal 
              history verification and identity confirmation. Professionals with concerning 
              background check results may be denied platform access. Background checks are 
              conducted for safety and trust purposes.
            </p>
          </section>

          {/* Communication */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Communication & SMS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By using our service, you consent to receive:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>SMS notifications about job opportunities (professionals)</li>
              <li>Email updates about your requests (homeowners)</li>
              <li>Service-related communications</li>
              <li>Account and billing notifications</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can opt out of promotional messages at any time.
            </p>
          </section>

          {/* AI Assistant */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. AI Assistant</h2>
            <p className="text-gray-700 leading-relaxed">
              Our AI assistant provides general home improvement guidance. This information is for 
              educational purposes only and should not replace professional consultation. For 
              complex projects, always consult with licensed professionals.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Fixlo serves as a platform connecting users but is not responsible for the actual 
              services performed. We do not guarantee the quality of work, nor are we liable for 
              damages resulting from services. Disputes should be resolved directly between 
              homeowners and professionals.
            </p>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              We respect your privacy and handle personal information according to our Privacy Policy. 
              Information may be shared between homeowners and professionals to facilitate services. 
              We use secure payment processing through Stripe.
            </p>
          </section>

          {/* Prohibited Uses */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Prohibited Uses</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Harassment or inappropriate behavior</li>
              <li>Fraudulent activities or false information</li>
              <li>Attempting to bypass platform fees</li>
              <li>Violating local laws or regulations</li>
              <li>Spamming or unsolicited marketing</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to terminate accounts that violate these Terms. Users may 
              also terminate their accounts at any time. Professional subscriptions can be 
              cancelled through the dashboard or by contacting support.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these Terms occasionally. Users will be notified of significant 
              changes via email or platform notifications. Continued use constitutes acceptance 
              of updated Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> pro4u.improvements@gmail.com<br />
                <strong>Response Time:</strong> Within 24 hours
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            By using Fixlo, you acknowledge that you have read and agree to these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;