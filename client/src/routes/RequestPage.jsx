import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceIntakeModal from '../components/ServiceIntakeModal';
import HelmetSEO from '../seo/HelmetSEO';

/**
 * RequestPage - Full-page service request form for ad campaigns
 *
 * Supports query parameters:
 * - city: Pre-fills the city field (e.g., charlotte-nc)
 * - service: Pre-fills the service type (e.g., plumbing)
 * - payment: 'success' or 'cancelled' — returned by Stripe after estimate-fee checkout
 *
 * Examples:
 * - /request
 * - /request?city=charlotte-nc
 * - /request?city=charlotte-nc&service=plumbing
 * - /request?payment=success&leadId=abc123
 * - /request?payment=cancelled&leadId=abc123
 */
export default function RequestPage() {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [heading, setHeading] = useState('Home Service Request');
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'cancelled' | null

  useEffect(() => {
    // Handle Stripe payment return
    const paymentParam = searchParams.get('payment');
    if (paymentParam === 'success' || paymentParam === 'cancelled') {
      setPaymentStatus(paymentParam);
      return; // Show payment result screen instead of the form
    }

    // Extract and process query parameters
    const cityParam = searchParams.get('city');
    const serviceParam = searchParams.get('service');

    if (cityParam) {
      // Extract city name without state suffix (e.g., "charlotte-nc" -> "charlotte")
      const cityName = cityParam.split('-')[0];
      const formattedCity = cityName.charAt(0).toUpperCase() + cityName.slice(1);

      // Pass just the city name to the modal
      setCity(cityName);
      setHeading(`${formattedCity} Home Service Request`);
    }

    if (serviceParam) {
      setService(serviceParam);
    }
  }, [searchParams]);

  // Page never closes the modal - it's the main content
  const handleClose = () => {
    // No-op: This is a dedicated page, not a modal overlay
  };

  if (paymentStatus === 'success') {
    return (
      <>
        <HelmetSEO
          title="Request Confirmed"
          description="Your estimate fee payment was received. A professional will be in touch shortly."
          canonicalPathname="/request"
        />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-8">
          <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Received!</h1>
            <p className="text-slate-600 mb-6">
              Your estimate fee has been processed and your service request is confirmed.
              A verified professional will reach out to you shortly.
            </p>
            <a
              href="/"
              className="inline-block bg-brand text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              Back to Home
            </a>
          </div>
        </div>
      </>
    );
  }

  if (paymentStatus === 'cancelled') {
    return (
      <>
        <HelmetSEO
          title="Payment Cancelled"
          description="Your payment was cancelled. You can try again or submit a new request."
          canonicalPathname="/request"
        />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-8">
          <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
            <p className="text-slate-600 mb-6">
              Your payment was not completed. No charge was made. You can submit a new
              request at any time.
            </p>
            <a
              href="/request"
              className="inline-block bg-brand text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              Try Again
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HelmetSEO
        title={heading}
        description={`Request ${service || 'home services'} in ${city || 'your area'}. Get matched with verified local professionals.`}
        canonicalPathname="/request"
      />

      {/* Full-page wrapper with custom heading */}
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container-xl">
          <ServiceIntakeModal
            key={city || service ? `${city}-${service}` : 'default'}
            open={true}
            onClose={handleClose}
            defaultCity={city}
            defaultService={service}
            customHeading={heading}
          />
        </div>
      </div>
    </>
  );
}
