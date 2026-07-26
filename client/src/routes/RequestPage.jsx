import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceIntakeModal from '../components/ServiceIntakeModal';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

const API_URL = API_BASE;
const FORM_SESSION_KEY = 'fixlo_pending_service_request';

/**
 * RequestPage - Full-page service request form for ad campaigns
 *
 * Supports query parameters:
 * - city: Pre-fills the city field (e.g., charlotte-nc)
 * - service: Pre-fills the service type (e.g., plumbing)
 * - payment: 'success' or 'cancelled' — returned by Stripe after checkout
 * - session_id: Stripe Checkout Session ID returned on success
 *
 * Examples:
 * - /request
 * - /request?city=charlotte-nc
 * - /request?city=charlotte-nc&service=plumbing
 * - /request?payment=success&session_id=cs_test_xxx
 * - /request?payment=cancelled
 */
export default function RequestPage() {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [heading, setHeading] = useState('Home Service Request');
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'cancelled' | null
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [restoredFormData, setRestoredFormData] = useState(null);
  const [paidSessionId, setPaidSessionId] = useState(null);

  const verifyAndRestore = useCallback(async (sessionId) => {
    setPaymentStatus('verifying');
    try {
      const res = await fetch(`${API_URL}/api/requests/verify-checkout/${encodeURIComponent(sessionId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.paid) {
        setVerifyError('Payment could not be verified. Please try again or contact support.');
        setPaymentStatus('cancelled');
        return;
      }

      // Restore form data from sessionStorage
      let restored = null;
      try {
        const raw = sessionStorage.getItem(FORM_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Discard stale entries older than 2 hours
          if (Date.now() - (parsed.savedAt || 0) < 7200000) {
            restored = parsed;
          }
        }
      } catch (_) {}

      setPaidSessionId(sessionId);
      setRestoredFormData(restored || {});
      setPaymentVerified(true);
      setPaymentStatus('success');
    } catch (err) {
      setVerifyError('Unable to verify payment. Please contact support.');
      setPaymentStatus('cancelled');
    }
  }, []);

  useEffect(() => {
    const paymentParam = searchParams.get('payment');
    const sessionIdParam = searchParams.get('session_id');

    if (paymentParam === 'success' && sessionIdParam) {
      verifyAndRestore(sessionIdParam);
      return;
    }

    if (paymentParam === 'cancelled') {
      setPaymentStatus('cancelled');
      return;
    }

    // Normal page load — read city/service params
    const cityParam = searchParams.get('city');
    const serviceParam = searchParams.get('service');

    if (cityParam) {
      const cityName = cityParam.split('-')[0];
      const formattedCity = cityName.charAt(0).toUpperCase() + cityName.slice(1);
      setCity(cityName);
      setHeading(`${formattedCity} Home Service Request`);
    }

    if (serviceParam) {
      setService(serviceParam);
    }
  }, [searchParams, verifyAndRestore]);

  const handleClose = () => {
    // No-op: dedicated page
  };

  if (paymentStatus === 'verifying') {
    return (
      <>
        <HelmetSEO title="Verifying Payment" canonicalPathname="/request" />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-8">
          <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Verifying your payment…</h1>
            <p className="text-slate-600">Please wait while we confirm your payment with Stripe.</p>
          </div>
        </div>
      </>
    );
  }

  if (paymentStatus === 'success' && paymentVerified) {
    return (
      <>
        <HelmetSEO
          title="Complete Your Request"
          description="Your payment was confirmed. Please review your request details below."
          canonicalPathname="/request"
        />
        <div className="min-h-screen bg-slate-50 py-8">
          <div className="container-xl max-w-2xl">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-emerald-800">Payment confirmed!</p>
                <p className="text-sm text-emerald-700">
                  Your $75 Service Request Fee has been processed. Please review your information below and submit.
                </p>
              </div>
            </div>
            <ServiceIntakeModal
              key="post-payment"
              open={true}
              onClose={handleClose}
              defaultCity={city}
              defaultService={service}
              customHeading="Complete Your Service Request"
              restoredFormData={restoredFormData}
              restoredPaidSessionId={paidSessionId}
            />
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
            {verifyError && (
              <p className="text-red-600 text-sm mb-4">{verifyError}</p>
            )}
            <p className="text-slate-600 mb-6">
              Your payment was not completed. No charge was made. You can submit a new request at any time.
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
