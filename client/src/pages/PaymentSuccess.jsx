import React, { useEffect } from "react";

export default function PaymentSuccess() {
  useEffect(() => {
    // Fire Google Ads conversion
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: 'AW-17355871496/XYZ123ABC456', // Replace with your actual conversion label
        value: 59.99,
        currency: 'USD',
      });
    }
  }, []);

  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Payment Successful!</h1>
      <p>Thank you for subscribing to Fixlo Pro. We'll notify you with new leads soon.</p>
    </div>
  );
}