import React from 'react';

export default function HowItWorks() {
  return (
    <section className="how-it-works bg-gray-50 py-20 px-5">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Choose Your Service
            </h3>
            <p className="text-gray-600">
              Select from our wide range of home services and describe your project needs.
            </p>
          </div>
          
          <div className="text-center p-8">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Get Matched
            </h3>
            <p className="text-gray-600">
              We connect you with verified local professionals who fit your needs and budget.
            </p>
          </div>
          
          <div className="text-center p-8">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Book & Pay
            </h3>
            <p className="text-gray-600">
              Schedule your service and pay securely through our platform when the job is done.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}