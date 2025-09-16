import { useEffect } from "react";
import HelmetSEO from '../seo/HelmetSEO';

export default function Success() {
  useEffect(() => {
    // Trigger Google Ads conversion event
    window.gtag && window.gtag('event', 'conversion', {
      'send_to': 'AW-17355871496/CONVERSION_LABEL_PLACEHOLDER',
      'transaction_id': Date.now().toString() // optional unique ID
    });
  }, []);

  return (
    <>
      <HelmetSEO 
        title="Payment Successful - Fixlo" 
        canonicalPathname="/success" 
        description="Payment successful! Your Fixlo professional account is now active. Start receiving service requests and grow your business."
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-5">
        <div className="max-w-lg bg-white rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-8 flex items-center justify-center text-4xl text-white">
            ✓
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-5">🎉 Thank you for subscribing!</h1>
          <p className="text-lg text-gray-600 mb-8">Your Fixlo Pro subscription is now active.</p>
          
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-600 text-lg mb-4">What's Next?</h3>
            <ul className="text-gray-700 space-y-3">
              <li>• Complete your professional profile</li>
              <li>• Verify your background check</li>
              <li>• Start receiving service requests</li>
              <li>• Grow your business with Fixlo</li>
            </ul>
          </div>

          <div className="space-y-4">
            <a 
              href="/pro/dashboard" 
              className="inline-block w-full bg-purple-600 text-white py-4 px-6 rounded-full font-semibold hover:bg-purple-700 transition-colors"
            >
              Go to Dashboard
            </a>
            <a 
              href="/" 
              className="inline-block w-full text-purple-600 py-3 px-6 font-medium hover:text-purple-700 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </>
  );
}