import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { ReferralAuthProvider } from './context/ReferralAuthContext';
import { RecruiterAuthProvider } from './context/RecruiterAuthContext';
import App from './App';
import './index.css';
import './dashboard-theme.css';

const DASHBOARD_PATHS = [
  '/admin',
  '/dashboard',
  '/pros/dashboard',
  '/pro/dashboard',
  '/homeowner/dashboard',
  '/dashboard/homeowner',
  '/recruiter/dashboard',
  '/dashboard/recruiter',
];

function DashboardThemeRouteSync() {
  const location = useLocation();

  React.useEffect(() => {
    const pathname = location.pathname.toLowerCase();
    const isDashboard = DASHBOARD_PATHS.some((path) =>
      pathname === path || pathname.startsWith(`${path}/`)
    );

    document.body.classList.toggle('fixlo-dashboard-theme', isDashboard);
    document.body.dataset.fixloSurface = isDashboard ? 'dashboard' : 'public';

    return () => {
      document.body.classList.remove('fixlo-dashboard-theme');
      delete document.body.dataset.fixloSurface;
    };
  }, [location.pathname]);

  return null;
}

// Clean URL parameters client-side for better SEO
if (typeof window !== 'undefined' && window.location.search) {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ref', 'campaign'];
  let hasTrackingParams = false;
  
  trackingParams.forEach(param => {
    if (urlParams.has(param)) {
      hasTrackingParams = true;
    }
  });
  
  if (hasTrackingParams) {
    window.history.replaceState({}, '', window.location.pathname);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <DashboardThemeRouteSync />
        <AuthProvider>
          <ReferralAuthProvider>
            <RecruiterAuthProvider>
              <App />
              <Analytics /> {/* Vercel Web Analytics */}
            </RecruiterAuthProvider>
          </ReferralAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
