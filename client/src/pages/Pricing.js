import React from 'react';

export default function Pricing() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-center">
      <h1 className="text-4xl font-bold mb-6">Pricing</h1>
      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-semibold mb-2">Pro Membership</h2>
        <p className="text-gray-600 mb-4">For licensed professionals who want job leads in their area.</p>
        <div className="text-4xl font-bold mb-4">$59.99<span className="text-lg font-medium">/month</span></div>
        <ul className="text-left text-gray-700 mb-6 list-disc list-inside">
          <li>✔️ Get exclusive job leads from nearby homeowners</li>
          <li>✔️ Appear in Fixlo's local listings</li>
          <li>✔️ SMS notifications for new leads</li>
          <li>✔️ Cancel anytime, no contracts</li>
        </ul>
        <a
          href="/signup"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Join Now
        </a>
      </div>
    </div>
  );
}
