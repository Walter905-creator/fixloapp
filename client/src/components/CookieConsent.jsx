import React, { useState, useEffect } from 'react';

/**
 * Cookie Consent Banner Component
 * Implements GDPR/CCPA cookie consent requirements
 */
const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('fixlo_cookie_consent');
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
      } catch (e) {
        console.error('Error loading cookie preferences:', e);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('fixlo_cookie_consent', JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setShowBanner(false);
    setShowPreferences(false);
    
    // Initialize analytics if accepted
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      });
    }
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('fixlo_cookie_consent', JSON.stringify(onlyNecessary));
    setPreferences(onlyNecessary);
    setShowBanner(false);
    setShowPreferences(false);

    // Deny analytics
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied'
      });
    }
  };

  const handleSavePreferences = () => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('fixlo_cookie_consent', JSON.stringify(consentData));
    setShowBanner(false);
    setShowPreferences(false);

    // Update analytics consent
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'ad_storage': preferences.marketing ? 'granted' : 'denied'
      });
    }
  };

  const togglePreference = (key) => {
    if (key === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 border-t border-gray-700 shadow-lg animate-slide-up">
      <div className="max-w-6xl mx-auto">
        {!showPreferences ? (
          // Main consent banner
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">🍪 We value your privacy</h3>
              <p className="text-gray-300 text-sm">
                We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic. 
                By clicking "Accept All", you consent to our use of cookies. You can manage your preferences or learn more 
                in our{' '}
                <a href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                  Privacy Policy
                </a>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition whitespace-nowrap"
              >
                Cookie Preferences
              </button>
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition whitespace-nowrap"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition whitespace-nowrap"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Cookie preferences panel
          <div className="text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Cookie Preferences</h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {/* Necessary Cookies */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium">Necessary Cookies</label>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-5 h-5 rounded bg-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-sm text-gray-400">
                  These cookies are essential for the website to function properly. They enable core functionality 
                  such as security, network management, and accessibility. These cookies cannot be disabled.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium">Analytics Cookies</label>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => togglePreference('analytics')}
                    className="w-5 h-5 rounded bg-gray-600 cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-400">
                  These cookies help us understand how visitors interact with our website by collecting and 
                  reporting information anonymously. This helps us improve the user experience.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium">Marketing Cookies</label>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => togglePreference('marketing')}
                    className="w-5 h-5 rounded bg-gray-600 cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-400">
                  These cookies are used to track visitors across websites to display relevant advertisements 
                  and measure the effectiveness of our marketing campaigns.
                </p>
              </div>

              {/* Functional Cookies */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium">Functional Cookies</label>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={() => togglePreference('functional')}
                    className="w-5 h-5 rounded bg-gray-600 cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-400">
                  These cookies enable enhanced functionality and personalization, such as remembering your 
                  preferences and settings.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Accept All
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;
