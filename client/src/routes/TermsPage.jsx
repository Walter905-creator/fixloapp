import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function TermsPage(){
  return (<>
    <HelmetSEO title="Terms of Service | Fixlo" canonicalPathname="/terms" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Terms of Service</h1>
      <div className="card p-5 space-y-4 text-sm leading-6 text-slate-300">
        <p><strong>Last Updated:</strong> 2025-09-01</p>
        <p>Welcome to Fixlo. These Terms govern your access to and use of the Fixlo website, products, and services.</p>
        <h2 className="text-lg font-semibold">1. Role of Fixlo</h2>
        <p>Fixlo connects homeowners with independent service professionals (“Pros”). Fixlo is not the employer, agent, or joint venturer of Pros, and does not perform the services.</p>
        <h2 className="text-lg font-semibold">2. User Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide accurate information when requesting service or creating an account.</li>
          <li>Comply with applicable laws and safety guidelines.</li>
          <li>Do not use the platform to send unlawful or abusive content.</li>
        </ul>
        <h2 className="text-lg font-semibold">3. Pros</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Pros are solely responsible for licensing, insurance, and quality of work.</li>
          <li>Pros agree to background checks where applicable and to abide by local regulations.</li>
        </ul>
        <h2 className="text-lg font-semibold">4. Payments</h2>
        <p>Payments and subscriptions for Pros may be processed by third‑party providers such as Stripe. By proceeding to checkout you agree to Stripe’s terms and privacy notices. Fixlo does not store full payment card details.</p>
        <h2 className="text-lg font-semibold">5. Communications & SMS</h2>
        <p>By providing your phone number you consent to receive automated text messages related to quotes, scheduling, and account updates. Message and data rates may apply. Reply STOP to opt out at any time.</p>
        <h2 className="text-lg font-semibold">6. Content & IP</h2>
        <p>All trademarks, logos, and content on the site are the property of their respective owners. You may not copy or misuse content without prior permission.</p>
        <h2 className="text-lg font-semibold">7. Disclaimers</h2>
        <p>Services are provided “as‑is” and “as available.” Fixlo disclaims warranties to the maximum extent permitted by law. Fixlo is not responsible for acts or omissions of Pros.</p>
        <h2 className="text-lg font-semibold">8. Limitation of Liability</h2>
        <p>To the fullest extent permitted by law, Fixlo shall not be liable for indirect, incidental, special, or consequential damages. Our aggregate liability will not exceed the amount you paid to Fixlo in the past 12 months.</p>
        <h2 className="text-lg font-semibold">9. Termination</h2>
        <p>We may suspend or terminate access for any reason, including breach of these Terms.</p>
        <h2 className="text-lg font-semibold">10. Governing Law</h2>
        <p>These Terms are governed by the laws of the state where Fixlo is headquartered, without regard to conflict of law principles.</p>
        <h2 className="text-lg font-semibold">11. Contact</h2>
        <p>Questions? Email <a href="mailto:pro4u.improvements@gmail.com">pro4u.improvements@gmail.com</a>.</p>
      </div>
    </div>
  </>);
}
