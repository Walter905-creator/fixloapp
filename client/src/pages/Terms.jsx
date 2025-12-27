import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { detectUserCountry } from "../utils/countryDetection";

export default function Terms() {
  const [countryInfo, setCountryInfo] = useState(null);

  useEffect(() => {
    async function loadCountry() {
      try {
        const country = await detectUserCountry();
        setCountryInfo(country);
      } catch (error) {
        console.error('Failed to detect country:', error);
      }
    }
    loadCountry();
  }, []);

  const getGoverningLaw = () => {
    if (!countryInfo) return "State of North Carolina, USA";
    
    switch (countryInfo.countryCode) {
      case 'CA': return "Province of Ontario, Canada";
      case 'GB': return "England and Wales";
      case 'AU': return "State of New South Wales, Australia";
      case 'NZ': return "New Zealand";
      case 'ES': return "Spain (EU laws apply)";
      case 'MX': return "Mexico City, Mexico";
      case 'BR': return "São Paulo, Brazil";
      case 'CO': return "Bogotá, Colombia";
      case 'CL': return "Santiago, Chile";
      case 'AR': return "Buenos Aires, Argentina";
      default: return "State of North Carolina, USA";
    }
  };

  const getJurisdiction = () => {
    if (!countryInfo) return "Charlotte, North Carolina, USA";
    
    switch (countryInfo.countryCode) {
      case 'CA': return "Toronto, Ontario, Canada";
      case 'GB': return "London, England";
      case 'AU': return "Sydney, New South Wales, Australia";
      case 'NZ': return "Auckland, New Zealand";
      case 'ES': return "Madrid, Spain";
      case 'MX': return "Mexico City, Mexico";
      case 'BR': return "São Paulo, Brazil";
      case 'CO': return "Bogotá, Colombia";
      case 'CL': return "Santiago, Chile";
      case 'AR': return "Buenos Aires, Argentina";
      default: return "Charlotte, North Carolina, USA";
    }
  };

  const showEUNotice = () => {
    return countryInfo && (countryInfo.countryCode === 'GB' || countryInfo.countryCode === 'ES');
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 prose prose-invert">
      <Helmet>
        <title>Terms & Conditions | Fixlo</title>
        <meta
          name="description"
          content="Terms & Conditions for using Fixlo's website, marketplace, subscriptions, and services across all global markets."
        />
        <link rel="canonical" href="https://www.fixloapp.com/terms" />
      </Helmet>

      <h1>Terms &amp; Conditions</h1>
      <p><strong>Last updated:</strong> December 27, 2025</p>
      
      {countryInfo && !countryInfo.fallback && (
        <div className="not-prose bg-blue-50 border border-blue-200 rounded-lg p-4 my-4 text-slate-800">
          <p className="font-semibold text-sm">📍 Your Location: {countryInfo.countryName}</p>
          <p className="text-xs mt-1">
            These terms apply to users in {countryInfo.countryName}. Country-specific provisions are included below.
          </p>
        </div>
      )}

      <h2>1. Overview</h2>
      <p>
        Welcome to Fixlo ("<strong>Fixlo</strong>," "<strong>we</strong>," "<strong>our</strong>," or "<strong>us</strong>"). 
        Fixlo operates a marketplace that connects homeowners ("<strong>Homeowners</strong>") with independent professionals
        ("<strong>Pros</strong>") offering services such as plumbing, electrical, carpentry, painting, HVAC, roofing, landscaping,
        house-cleaning, junk removal, and related home services (collectively, the "<strong>Services</strong>"). By accessing or using
        our website, applications, or any related tools (the "<strong>Platform</strong>"), you agree to these Terms &amp; Conditions
        (the "<strong>Terms</strong>").
      </p>
      <p>
        <strong>International Service:</strong> Fixlo operates in multiple countries including the United States, Canada, United Kingdom,
        Australia, New Zealand, Spain, Mexico, Brazil, Colombia, Chile, and Argentina. Country-specific terms may apply.
      </p>

      <h2>2. Marketplace Role</h2>
      <p>
        Fixlo is a platform and <strong>does not perform services</strong>. Pros are independent third parties, not employees,
        agents, or joint-venturers of Fixlo. We do not supervise, direct, or control a Pro's work and are not responsible for
        the quality, timing, legality, or outcomes of any Services performed by Pros.
      </p>

      <h2>3. Accounts &amp; Eligibility</h2>
      <ul>
        <li>You must be at least 18 years old to use the Platform (or the age of majority in your jurisdiction).</li>
        <li>You agree to provide accurate, current, and complete information and to keep it updated.</li>
        <li>You are responsible for all activity under your account and for maintaining the confidentiality of your login.</li>
        <li>You represent that you are legally permitted to use the Platform in your jurisdiction.</li>
      </ul>

      <h2>4. Subscriptions, Payments &amp; Fees</h2>
      <p>
        Pros may purchase subscriptions (e.g., monthly plans) or other paid offerings through our payment processor
        (e.g., Stripe). Pricing and plan details are shown at checkout and/or on our Pricing page. Prices are displayed
        in your local currency based on your location. Taxes may apply according to local regulations.
      </p>
      <ul>
        <li>
          <strong>Billing.</strong> By starting a subscription, you authorize recurring charges until you cancel.
        </li>
        <li>
          <strong>Cancellations.</strong> You can cancel any time; your plan remains active through the current billing period.
        </li>
        <li>
          <strong className="text-red-600">NO REFUND POLICY (GLOBAL):</strong> All subscription fees, service fees, and other charges
          are <strong>strictly non-refundable</strong> in all jurisdictions where we operate. This applies worldwide without exception.
          By subscribing or making a payment, you acknowledge and agree that you will not be entitled to any refund, credit, or 
          reimbursement for any reason, including but not limited to: early cancellation, dissatisfaction with the service, technical 
          issues, change of mind, or any other circumstance. This no-refund policy complies with applicable consumer protection laws 
          in each jurisdiction, which allow businesses to maintain such policies when clearly disclosed prior to purchase.
        </li>
        <li>
          <strong>Chargebacks &amp; Disputes.</strong> Initiating a chargeback without first attempting to resolve the issue with Fixlo 
          may result in immediate account suspension. Contact us at <a href="mailto:pro4u.improvements@gmail.com">pro4u.improvements@gmail.com</a>
          before initiating any payment dispute. Accounts with unresolved payment issues will be suspended.
        </li>
        <li>
          <strong>Currency &amp; Exchange Rates:</strong> Prices are displayed in your local currency. Currency conversion rates are 
          updated periodically and may fluctuate. You are responsible for any currency conversion fees charged by your bank or payment provider.
        </li>
      </ul>

      <h2>5. Background Checks for Pros</h2>
      <p>
        If offered, Pros may undergo identity verification and/or background screenings through third-party providers (e.g., Checkr). 
        Screening availability and scope vary by jurisdiction. Fixlo does not guarantee that a screening will identify all relevant history.
        Pros are solely responsible for complying with all laws applicable to their work.
      </p>

      <h2>6. Communications &amp; SMS Consent</h2>
      <p>
        By providing your phone number and opting in, you agree to receive SMS messages about quotes, scheduling, and service updates.
        Message frequency varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt out, or <strong>HELP</strong> for help.
        Consent is not a condition of purchase. See our Privacy Policy for details.
      </p>

      <h2>7. User Content &amp; Reviews</h2>
      <ul>
        <li>You are responsible for the content you submit (e.g., job descriptions, messages, reviews).</li>
        <li>Do not post unlawful, misleading, defamatory, infringing, or harmful content.</li>
        <li>By submitting content, you grant Fixlo a non-exclusive, worldwide, royalty-free license to host, display, and use it
            for operating and improving the Platform.</li>
      </ul>

      <h2>8. Pro Conduct &amp; Compliance</h2>
      <p>
        Pros are responsible for obtaining all permits, licenses, and insurance required to perform Services; quoting accurately; 
        showing up on time; and performing Services in a professional, workmanlike manner. Pros must comply with applicable laws,
        codes, and safety standards in their jurisdiction.
      </p>

      <h2>9. Prohibited Activities</h2>
      <ul>
        <li>Using the Platform for unlawful purposes or to facilitate illegal activity.</li>
        <li>Harassment, discrimination, hate speech, or abusive conduct.</li>
        <li>Attempting to circumvent fees, interfere with the Platform, or scrape data without permission.</li>
        <li>Violating export controls or sanctions in any jurisdiction.</li>
      </ul>

      <h2>10. Disclaimers</h2>
      <p>
        THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, FIXLO DISCLAIMS ALL WARRANTIES,
        EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        FIXLO DOES NOT WARRANT THAT SERVICES PERFORMED BY PROS WILL MEET YOUR EXPECTATIONS OR BE ERROR-FREE.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, FIXLO WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY,
        OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, OR DATA, EVEN IF ADVISED OF THE POSSIBILITY. IN NO EVENT WILL FIXLO'S TOTAL
        LIABILITY EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO FIXLO IN THE 6 MONTHS PRIOR TO THE CLAIM OR (B) USD $100 (or 
        equivalent in your local currency).
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless Fixlo and its officers, directors, employees, and agents from any claims,
        liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your use of
        the Platform, your content, your violation of these Terms, or your interactions with Pros/Homeowners.
      </p>

      <h2>13. Termination</h2>
      <p>
        We may suspend or terminate your access to the Platform at any time for any reason, including violations of these Terms.
        You may stop using the Platform at any time. Upon termination, you remain liable for all outstanding fees and obligations.
        Sections that by their nature should survive termination will survive.
      </p>

      <h2>14. Governing Law &amp; Disputes</h2>
      <p>
        These Terms are governed by the laws of <strong>{getGoverningLaw()}</strong>, without regard to conflict-of-laws principles.
        You agree to the exclusive jurisdiction and venue of courts located in <strong>{getJurisdiction()}</strong>.
      </p>
      {showEUNotice() && (
        <p className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-slate-800">
          <strong>EU Users:</strong> Nothing in these Terms affects your statutory rights under EU consumer protection law.
          You may have additional rights regarding refunds and cancellations under EU Distance Selling Directive, subject to
          our clearly stated no-refund policy for digital services to which you have consented prior to purchase.
        </p>
      )}

      <h2>15. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. The "Last updated" date above reflects the latest changes. Material changes
        will be posted on the Platform. Your continued use after changes constitutes acceptance.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these Terms? Contact <a href="mailto:pro4u.improvements@gmail.com">pro4u.improvements@gmail.com</a>.
      </p>

      {/* Country-Specific Appendices */}
      <div className="mt-12 border-t border-slate-700 pt-8">
        <h2>Appendix A: Country-Specific Terms</h2>
        
        {(!countryInfo || countryInfo.countryCode === 'CA') && (
          <>
            <h3 className="text-lg font-bold mt-6">Canada</h3>
            <ul className="text-sm">
              <li>Services are subject to applicable provincial consumer protection laws.</li>
              <li>Prices include applicable GST/HST/PST as required by law.</li>
              <li>Quebec residents: Services are offered in English; French translations available upon request.</li>
              <li>Consumer rights vary by province; contact us for jurisdiction-specific information.</li>
            </ul>
          </>
        )}

        {(!countryInfo || countryInfo.countryCode === 'GB') && (
          <>
            <h3 className="text-lg font-bold mt-6">United Kingdom</h3>
            <ul className="text-sm">
              <li>UK Consumer Rights Act 2015 applies to services provided.</li>
              <li>Prices include VAT at 20% where applicable.</li>
              <li>Data processing complies with UK GDPR requirements.</li>
              <li>Distance selling regulations apply; digital service refund rights are explicitly waived by subscription purchase.</li>
            </ul>
          </>
        )}

        {(!countryInfo || countryInfo.countryCode === 'AU') && (
          <>
            <h3 className="text-lg font-bold mt-6">Australia</h3>
            <ul className="text-sm">
              <li>Australian Consumer Law (ACL) provides statutory guarantees that cannot be excluded.</li>
              <li>Prices include GST at 10%.</li>
              <li>Nothing in these Terms excludes, restricts, or modifies any guarantee, warranty, term, condition, right, or remedy
                  implied or imposed by the ACL that cannot lawfully be excluded, restricted, or modified.</li>
            </ul>
          </>
        )}

        {(!countryInfo || countryInfo.countryCode === 'NZ') && (
          <>
            <h3 className="text-lg font-bold mt-6">New Zealand</h3>
            <ul className="text-sm">
              <li>Consumer Guarantees Act 1993 applies to services.</li>
              <li>Prices include GST at 15%.</li>
              <li>Fair Trading Act 1986 protections apply to all transactions.</li>
            </ul>
          </>
        )}

        {(!countryInfo || countryInfo.countryCode === 'MX') && (
          <>
            <h3 className="text-lg font-bold mt-6">Mexico</h3>
            <ul className="text-sm">
              <li>Services comply with Ley Federal de Protección al Consumidor.</li>
              <li>Prices include IVA (16%) where applicable.</li>
              <li>Billing and receipts provided in compliance with SAT requirements.</li>
            </ul>
          </>
        )}

        {(!countryInfo || countryInfo.countryCode === 'BR') && (
          <>
            <h3 className="text-lg font-bold mt-6">Brazil</h3>
            <ul className="text-sm">
              <li>Services comply with Código de Defesa do Consumidor (CDC).</li>
              <li>Prices include applicable taxes (ICMS, PIS, COFINS).</li>
              <li>Electronic invoices (Nota Fiscal Eletrônica) issued for all transactions.</li>
              <li>Right of withdrawal (7 days) applies only to physical goods, not digital services to which you gain immediate access.</li>
            </ul>
          </>
        )}

        {(!countryInfo || ['CO', 'CL', 'AR'].includes(countryInfo?.countryCode)) && (
          <>
            <h3 className="text-lg font-bold mt-6">Latin America (Colombia, Chile, Argentina)</h3>
            <ul className="text-sm">
              <li>Services comply with local consumer protection regulations.</li>
              <li>Prices include applicable local taxes (IVA).</li>
              <li>Currency conversion and payment processing fees may apply.</li>
              <li>Local payment methods supported through our payment processor.</li>
            </ul>
          </>
        )}

        {(!countryInfo || countryInfo.countryCode === 'ES') && (
          <>
            <h3 className="text-lg font-bold mt-6">Spain (España)</h3>
            <ul className="text-sm">
              <li>Services comply with Spanish consumer protection law and EU directives.</li>
              <li>Prices include IVA at 21%.</li>
              <li>Right of withdrawal (14 days) for distance contracts, waived for digital services with immediate access upon consent.</li>
              <li>Complaints: Contact Fixlo first. If unresolved, you may access ODR platform: https://ec.europa.eu/consumers/odr</li>
            </ul>
          </>
        )}
      </div>

      <div className="mt-8 p-4 bg-slate-800 rounded-lg text-sm">
        <p className="font-semibold">Legal Notice</p>
        <p className="mt-2">
          By using Fixlo, you acknowledge that you have read, understood, and agree to be bound by these Terms, including our 
          strict no-refund policy that applies globally. If you do not agree, you must not use the Platform.
        </p>
      </div>
    </main>
  );
}
        Message frequency varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt out, or <strong>HELP</strong> for help.
        Consent is not a condition of purchase. See our Privacy Policy for details.
      </p>

      <h2>7. User Content &amp; Reviews</h2>
      <ul>
        <li>You are responsible for the content you submit (e.g., job descriptions, messages, reviews).</li>
        <li>Do not post unlawful, misleading, defamatory, infringing, or harmful content.</li>
        <li>By submitting content, you grant Fixlo a non-exclusive, worldwide, royalty-free license to host, display, and use it
            for operating and improving the Platform.</li>
      </ul>

      <h2>8. Pro Conduct &amp; Compliance</h2>
      <p>
        Pros are responsible for obtaining all permits, licenses, and insurance required to perform Services; quoting accurately; 
        showing up on time; and performing Services in a professional, workmanlike manner. Pros must comply with applicable laws,
        codes, and safety standards.
      </p>

      <h2>9. Prohibited Activities</h2>
      <ul>
        <li>Using the Platform for unlawful purposes or to facilitate illegal activity.</li>
        <li>Harassment, discrimination, hate speech, or abusive conduct.</li>
        <li>Attempting to circumvent fees, interfere with the Platform, or scrape data without permission.</li>
      </ul>

      <h2>10. Disclaimers</h2>
      <p>
        THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, FIXLO DISCLAIMS ALL WARRANTIES,
        EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        FIXLO DOES NOT WARRANT THAT SERVICES PERFORMED BY PROS WILL MEET YOUR EXPECTATIONS OR BE ERROR-FREE.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, FIXLO WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY,
        OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, OR DATA, EVEN IF ADVISED OF THE POSSIBILITY. IN NO EVENT WILL FIXLO'S TOTAL
        LIABILITY EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO FIXLO IN THE 6 MONTHS PRIOR TO THE CLAIM OR (B) USD $100.
      </p>

      <h2>12. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless Fixlo and its officers, directors, employees, and agents from any claims,
        liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your use of
        the Platform, your content, your violation of these Terms, or your interactions with Pros/Homeowners.
      </p>

      <h2>13. Termination</h2>
      <p>
        We may suspend or terminate your access to the Platform at any time for any reason, including violations of these Terms.
        You may stop using the Platform at any time. Sections that by their nature should survive termination will survive.
      </p>

      <h2>14. Governing Law &amp; Disputes</h2>
      <p>
        These Terms are governed by the laws of the State of North Carolina, USA, without regard to conflict-of-laws principles.
        You agree to the exclusive jurisdiction and venue of state and federal courts located in Charlotte, North Carolina.
      </p>

      <h2>15. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. The "Last updated" date above reflects the latest changes. Material changes
        will be posted on the Platform. Your continued use after changes constitutes acceptance.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these Terms? Contact <a href="mailto:pro4u.improvements@gmail.com">pro4u.improvements@gmail.com</a>.
      </p>
    </main>
  );
}