import React from 'react';

export default function Features() {
  return (
    <section className="features bg-white py-20 px-5">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Why Choose Fixlo?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Verified Professionals
            </h3>
            <p className="text-gray-600">
              Background-checked and reliable tradespeople you can trust.
            </p>
          </div>
          
          <div className="text-center p-8">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Live Chat
            </h3>
            <p className="text-gray-600">
              Chat with pros in real time to discuss your project needs.
            </p>
          </div>
          
          <div className="text-center p-8">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Secure Payments
            </h3>
            <p className="text-gray-600">
              Safe and secure payment processing for your peace of mind.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}