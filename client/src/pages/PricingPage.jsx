import React, { useState } from 'react';

export default function PricingPage() {
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    try {
      const res = await fetch('https://fixloapp.onrender.com/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'pro4u.improvements@gmail.com', // Replace this dynamically if needed
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Stripe Checkout URL
      } else {
        throw new Error("No URL received");
      }
    } catch (err) {
      console.error(err);
      alert('Error starting subscription. Please try again.');
    }
  };

  // This modal would display after redirect (optional)
  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm">
        <h2 className="text-2xl font-bold mb-4">✅ You're subscribed!</h2>
        <p>Welcome to Fixlo Pro. Job leads are on their way.</p>
        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setSuccess(false)}
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Fixlo Pro Subscription</h1>
      <div className="bg-white shadow-lg rounded-lg p-6 text-center border">
        <p className="text-xl font-semibold mb-4">$59.99 / month</p>
        <p className="mb-6">Receive homeowner job leads directly via SMS and dashboard.</p>
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          onClick={handleSubscribe}
        >
          Subscribe Now
        </button>
      </div>

      {success && <SuccessModal />}
    </div>
  );
}