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
  const [paymentSessionId, setPaymentSessionId] = useState('');

  useEffect(() => {
    // Handle Stripe payment return
    const paymentParam = searchParams.get('payment');
    if (paymentParam === 'success' || paymentParam === 'cancelled') {
      setPaymentStatus(paymentParam);
      setPaymentSessionId(searchParams.get('session_id') || '');
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
          {paymentStatus === 'success' && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              ✅ Payment received. Please complete and submit your Request a Service form.
            </div>
          )}
          {paymentStatus === 'cancelled' && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              Payment was cancelled. You can continue the form and complete payment when submitting.
            </div>
          )}
          <ServiceIntakeModal
            key={city || service ? `${city}-${service}` : 'default'}
            open={true}
            onClose={handleClose}
            defaultCity={city}
            defaultService={service}
            customHeading={heading}
            paymentSessionId={paymentSessionId}
          />
        </div>
      </div>
    </>
  );
}
