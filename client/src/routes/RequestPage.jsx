import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceIntakeModal from '../components/ServiceIntakeModal';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

const FORM_SESSION_KEY = 'fixlo_service_request_draft';

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
  const [restoredFormData, setRestoredFormData] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const restoreDraft = () => {
      try {
        const raw = window.sessionStorage.getItem(FORM_SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    };

    const handlePaymentReturn = async () => {
      const paymentParam = searchParams.get('payment');
      const sessionId = searchParams.get('session_id') || '';
      const draft = restoreDraft();
      setRestoredFormData(draft);

      if (paymentParam === 'cancelled') {
        if (!cancelled) {
          setPaymentStatus('cancelled');
          setPaymentSessionId('');
          setPaymentMessage('Payment was cancelled. Return to Review & Payment to complete the $75 Service Request Fee.');
        }
        return;
      }

      if (paymentParam === 'success' && sessionId) {
        try {
          const response = await fetch(`${API_BASE}/api/requests/verify-checkout/${encodeURIComponent(sessionId)}`, {
            method: 'GET',
            credentials: 'include'
          });
          const payload = await response.json().catch(() => ({}));

          if (!cancelled && response.ok && payload?.ok && payload?.data?.paid) {
            setPaymentStatus('success');
            setPaymentSessionId(sessionId);
            setPaymentMessage('✅ Payment received. Continue with Step 7 to submit your request.');
            return;
          }
        } catch (_) {
          // no-op
        }

        if (!cancelled) {
          setPaymentStatus('cancelled');
          setPaymentSessionId('');
          setPaymentMessage('Payment verification failed. Please complete checkout again to continue.');
        }
      }
    };

    handlePaymentReturn();

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

    return () => {
      cancelled = true;
    };
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
              {paymentMessage || '✅ Payment received. Continue with Step 7 to submit your request.'}
            </div>
          )}
          {paymentStatus === 'cancelled' && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              {paymentMessage || 'Payment was cancelled. Return to Review & Payment to complete checkout.'}
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
            restoredFormData={restoredFormData}
            restoredPaidSessionId={paymentSessionId}
            paymentReturnStatus={paymentStatus}
          />
        </div>
      </div>
    </>
  );
}
