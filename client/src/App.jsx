import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PromoBanner from './components/PromoBanner';
import CookieConsent from './components/CookieConsent';
import MetaPixelTracker from './components/MetaPixelTracker';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RecruiterProtectedRoute from './components/RecruiterProtectedRoute';
import RequireAdmin from './components/RequireAdmin';
import HomePage from './routes/HomePage.jsx';
import ServicesPage from './routes/ServicesPage.jsx';
import HowItWorksPage from './routes/HowItWorksPage.jsx';
import AssistantPage from './routes/AssistantPage.jsx';
import ContactPage from './routes/ContactPage.jsx';
import PricingPage from './routes/PricingPage.jsx';
import ProSignInPage from './routes/ProSignInPage.jsx';
import ProForgotPasswordPage from './routes/ProForgotPasswordPage.jsx';
import ProResetPasswordPage from './routes/ProResetPasswordPage.jsx';
import AdminPage from './routes/AdminPage.jsx';
import AdminJobsPage from './routes/AdminJobsPage.jsx';
import AdminSocialMediaPage from './routes/AdminSocialMediaPage.jsx';
import AdminSettingsPage from './routes/AdminSettingsPage.jsx';
import AdminLeadHunterPage from './routes/AdminLeadHunterPage.jsx';
import AdminSEOAIPage from './routes/AdminSEOAIPage.jsx';
import ProDashboardPage from './routes/ProDashboardPage.jsx';
import ContractorDashboardPage from './routes/ContractorDashboardPage.jsx';
import JoinPage from './routes/JoinPage.jsx';
import ServicePage from './routes/ServicePage.jsx';
import JobManagementPage from './routes/JobManagementPage.jsx';
import CustomerPortalPage from './routes/CustomerPortalPage.jsx';
import CountryPage from './routes/CountryPage.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import PrivacySettings from './pages/PrivacySettings.jsx';
import Success from './pages/Success.jsx';
import SignupPage from './routes/SignupPage.jsx';
import ProSignupPage from './routes/ProSignupPage.jsx';
import ProSetupAccountPage from './routes/ProSetupAccountPage.jsx';
import AboutWalterArevaloPage from './routes/AboutWalterArevaloPage.jsx';
import AboutPage from './routes/AboutPage.jsx';
import TrendServicePage from './routes/TrendServicePage.jsx';
import CompetitorAlternativesPage from './routes/CompetitorAlternativesPage.jsx';
import EarnPage from './routes/EarnPage.jsx';
import EarnStartPage from './routes/EarnStartPage.jsx';
import EarnDashboardPage from './routes/EarnDashboardPage.jsx';
import ReferralSignInPage from './routes/ReferralSignInPage.jsx';
import RequestPage from './routes/RequestPage.jsx';
import LeadResponsePage from './routes/LeadResponsePage.jsx';
// Internal admin dashboard (private — requires admin role)
import InternalDashboardPage from './routes/InternalDashboardPage.jsx';
// Admin Invite Codes Management
import AdminInviteCodesPage from './routes/AdminInviteCodesPage.jsx';
// Recruiter Network
import RecruiterSignupPage from './routes/RecruiterSignupPage.jsx';
import RecruiterLoginPage from './routes/RecruiterLoginPage.jsx';
import RecruiterForgotPasswordPage from './routes/RecruiterForgotPasswordPage.jsx';
import RecruiterDashboardPage from './routes/RecruiterDashboardPage.jsx';
import RecruiterReferralsPage from './routes/RecruiterReferralsPage.jsx';
import RecruiterRecruitersPage from './routes/RecruiterRecruitersPage.jsx';
import RecruiterPaymentsPage from './routes/RecruiterPaymentsPage.jsx';
import RecruiterSettingsPage from './routes/RecruiterSettingsPage.jsx';
// Admin Recruiter Pages
import AdminRecruitersPage from './routes/AdminRecruitersPage.jsx';
import AdminCommissionsPage from './routes/AdminCommissionsPage.jsx';
import AdminPayoutsPage from './routes/AdminPayoutsPage.jsx';
import RecruiterDashboard from './pages/RecruiterDashboard.jsx';
import ProDashboard from './pages/ProDashboard.jsx';
// Auth pages
import HomeownerLogin from './pages/auth/HomeownerLogin.jsx';
import ProLogin from './pages/auth/ProLogin.jsx';
import RecruiterLogin from './pages/auth/RecruiterLogin.jsx';
import HomeownerSignup from './pages/auth/HomeownerSignup.jsx';
import ProSignup from './pages/auth/ProSignup.jsx';
import RecruiterSignup from './pages/auth/RecruiterSignup.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';

// Fixlo Growth Engine (FGE) — lazy-loaded for performance
const FGEGrowthDashboard    = React.lazy(() => import('./pages/fge/GrowthDashboard.jsx'));
const FGEMarketingCenter    = React.lazy(() => import('./pages/fge/MarketingCenter.jsx'));
const FGESeoEngine          = React.lazy(() => import('./pages/fge/SeoEngine.jsx'));
const FGEBlogEngine         = React.lazy(() => import('./pages/fge/BlogEngine.jsx'));
const FGEEmailAutomation    = React.lazy(() => import('./pages/fge/EmailAutomation.jsx'));
const FGESmsAutomation      = React.lazy(() => import('./pages/fge/SmsAutomation.jsx'));
const FGEReferralSystem     = React.lazy(() => import('./pages/fge/ReferralSystem.jsx'));
const FGEAnalyticsDashboard = React.lazy(() => import('./pages/fge/AnalyticsDashboard.jsx'));
const FGEAiInsights         = React.lazy(() => import('./pages/fge/AiInsights.jsx'));
const FGEReviewSystem       = React.lazy(() => import('./pages/fge/ReviewSystem.jsx'));
const FGESeasonalCampaigns  = React.lazy(() => import('./pages/fge/SeasonalCampaigns.jsx'));
const FGEQueueMonitor       = React.lazy(() => import('./pages/fge/QueueMonitor.jsx'));
const FGEAdminSettings      = React.lazy(() => import('./pages/fge/FGEAdminSettings.jsx'));

const HomeownerLanding = React.lazy(() => import('./pages/HomeownerLanding.jsx'));
const ProLanding = React.lazy(() => import('./pages/ProLanding.jsx'));
const RecruiterLanding = React.lazy(() => import('./pages/RecruiterLanding.jsx'));

function LazyRoute({ children }) {
  return (
    <React.Suspense
      fallback={
        <div className="container-xl py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Loading</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">Preparing your Fixlo page…</p>
          </div>
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
}
export default function App(){
  return (<>
    <MetaPixelTracker />
    <PromoBanner />
    <Navbar/>
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/services" element={<ServicesPage/>}/>
      
      {/* Country-aware service routes (international SEO) */}
      <Route path="/:country/services/:service/:city" element={<ServicePage/>}/>
      <Route path="/:country/services/:service" element={<ServicePage/>}/>
      <Route path="/:country/servicios/:service/:city" element={<ServicePage/>}/>
      <Route path="/:country/servicios/:service" element={<ServicePage/>}/>
      
      {/* Legacy service routes - redirect to US country path */}
      <Route path="/services/:service" element={<ServicePage legacy/>}/>
      <Route path="/services/:service/:city" element={<ServicePage legacy/>}/>
      
      {/* Trend-based SEO landing pages */}
      <Route path="/:trend/:service" element={<TrendServicePage/>}/>
      
      {/* Competitor alternatives pages */}
      <Route path="/alternatives-to-:competitor" element={<CompetitorAlternativesPage/>}/>
      <Route path="/:competitor-alternatives" element={<CompetitorAlternativesPage/>}/>
      <Route path="/:competitor-competitors" element={<CompetitorAlternativesPage/>}/>
      <Route path="/best-:competitor-alternative" element={<CompetitorAlternativesPage/>}/>
      
      <Route path="/how-it-works" element={<HowItWorksPage/>}/>
      <Route path="/assistant" element={<AssistantPage/>}/>
      <Route path="/ai-assistant" element={<AssistantPage/>}/>
      <Route path="/contact" element={<ContactPage/>}/>
      <Route path="/pricing" element={<PricingPage/>}/>
      <Route path="/request" element={<RequestPage/>}/>
      <Route path="/lead/:token" element={<LeadResponsePage/>}/>
      <Route path="/charlotte" element={<Navigate to="/request?city=charlotte-nc" replace/>}/>
      <Route path="/country/:countryCode" element={<CountryPage/>}/>
      <Route path="/signup" element={<SignupPage/>}/>
      <Route path="/homeowners" element={<LazyRoute><HomeownerLanding /></LazyRoute>}/>
      <Route path="/pros" element={<LazyRoute><ProLanding /></LazyRoute>}/>
      <Route path="/pros/signup" element={<ProSignupPage/>}/>
      <Route path="/pros/register" element={<ProSignupPage/>}/>
      <Route path="/pros/login" element={<ProSignInPage/>}/>
      <Route path="/pros/forgot-password" element={<ProForgotPasswordPage/>}/>
      <Route path="/pros/reset-password" element={<ProResetPasswordPage/>}/>
      <Route path="/pros/pricing" element={<PricingPage/>}/>
      <Route path="/pros/dashboard" element={
        <ProtectedRoute requiredRole="pro">
          <ProDashboardPage/>
        </ProtectedRoute>
      }/>
      <Route path="/dashboard/pro" element={
        <ProtectedRoute requiredRole="pro">
          <ProDashboard/>
        </ProtectedRoute>
      }/>
      <Route path="/pro/signup" element={<Navigate to="/pros/signup" replace/>}/>
      <Route path="/pro/register" element={<Navigate to="/pros/signup" replace/>}/>
      <Route path="/pro/setup-account/:token" element={<ProSetupAccountPage/>}/>
      <Route path="/pro/sign-in" element={<Navigate to="/pros/login" replace/>}/>
      <Route path="/pro/login" element={<Navigate to="/pros/login" replace/>}/>
      <Route path="/pro/forgot-password" element={<Navigate to="/pros/forgot-password" replace/>}/>
      <Route path="/pro/reset-password" element={<Navigate to="/pros/reset-password" replace/>}/>
      
      {/* Fixlo Internal Dashboard — /dashboard — admin only, not public */}
      <Route path="/dashboard" element={
        <RequireAdmin>
          <InternalDashboardPage/>
        </RequireAdmin>
      }/>

      {/* Admin routes - PRIVATE ONLY, not public, not linked anywhere */}
      <Route path="/dashboard/admin" element={
        <RequireAdmin>
          <AdminPage/>
        </RequireAdmin>
      }/>
      <Route path="/dashboard/admin/jobs" element={
        <RequireAdmin>
          <AdminJobsPage/>
        </RequireAdmin>
      }/>
      <Route path="/dashboard/admin/social" element={
        <RequireAdmin>
          <AdminSocialMediaPage/>
        </RequireAdmin>
      }/>
      <Route path="/dashboard/admin/settings" element={
        <RequireAdmin>
          <AdminSettingsPage/>
        </RequireAdmin>
      }/>
      <Route path="/dashboard/admin/lead-hunter" element={
        <RequireAdmin>
          <AdminLeadHunterPage/>
        </RequireAdmin>
      }/>
      <Route path="/dashboard/admin/seo-ai" element={
        <RequireAdmin>
          <AdminSEOAIPage/>
        </RequireAdmin>
      }/>
      <Route path="/dashboard/admin/invite-codes" element={
        <RequireAdmin>
          <AdminInviteCodesPage/>
        </RequireAdmin>
      }/>

      {/* Fixlo Growth Engine (FGE) — /dashboard/admin/fge/* — admin only */}
      <Route path="/dashboard/admin/fge" element={<RequireAdmin><LazyRoute><FGEGrowthDashboard /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/marketing" element={<RequireAdmin><LazyRoute><FGEMarketingCenter /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/seo" element={<RequireAdmin><LazyRoute><FGESeoEngine /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/blog" element={<RequireAdmin><LazyRoute><FGEBlogEngine /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/email" element={<RequireAdmin><LazyRoute><FGEEmailAutomation /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/sms" element={<RequireAdmin><LazyRoute><FGESmsAutomation /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/referral" element={<RequireAdmin><LazyRoute><FGEReferralSystem /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/analytics" element={<RequireAdmin><LazyRoute><FGEAnalyticsDashboard /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/insights" element={<RequireAdmin><LazyRoute><FGEAiInsights /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/reviews" element={<RequireAdmin><LazyRoute><FGEReviewSystem /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/seasonal" element={<RequireAdmin><LazyRoute><FGESeasonalCampaigns /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/queue" element={<RequireAdmin><LazyRoute><FGEQueueMonitor /></LazyRoute></RequireAdmin>} />
      <Route path="/dashboard/admin/fge/settings" element={<RequireAdmin><LazyRoute><FGEAdminSettings /></LazyRoute></RequireAdmin>} />

      <Route path="/admin" element={
        <RequireAdmin>
          <AdminPage/>
        </RequireAdmin>
      }/>
      
      {/* Old admin routes - redirect to prevent 404 hints */}
      <Route path="/admin/*" element={<Navigate to="/" replace/>}/>
      <Route path="/services/admin" element={<Navigate to="/" replace/>}/>
      <Route path="/services/*/admin" element={<Navigate to="/" replace/>}/>
      
      <Route path="/my-jobs" element={<CustomerPortalPage/>}/>
      <Route path="/pro/dashboard" element={
        <Navigate to="/pros/dashboard" replace/>
      }/>
      <Route path="/contractor/dashboard" element={<ContractorDashboardPage/>}/>
      <Route path="/staff/jobs" element={<JobManagementPage/>}/>
      <Route path="/join" element={<JoinPage/>}/>
      <Route path="/earn" element={<EarnPage/>}/>
      <Route path="/earn/start" element={<EarnStartPage/>}/>
      <Route path="/earn/sign-in" element={<ReferralSignInPage/>}/>
      <Route path="/earn/dashboard" element={<EarnDashboardPage/>}/>
      
      {/* Recruiter Network */}
      <Route path="/recruiter/signup" element={<RecruiterSignupPage/>}/>
      <Route path="/recruiter/login" element={<RecruiterLoginPage/>}/>
      <Route path="/recruiter/forgot-password" element={<RecruiterForgotPasswordPage/>}/>
      <Route path="/recruiter/dashboard" element={
        <RecruiterProtectedRoute>
          <RecruiterDashboardPage/>
        </RecruiterProtectedRoute>
      }/>
      <Route path="/dashboard/recruiter" element={
        <RecruiterProtectedRoute>
          <RecruiterDashboard/>
        </RecruiterProtectedRoute>
      }/>
      <Route path="/recruiter/referrals" element={
        <RecruiterProtectedRoute>
          <RecruiterReferralsPage/>
        </RecruiterProtectedRoute>
      }/>
      <Route path="/recruiter/recruiters" element={
        <RecruiterProtectedRoute>
          <RecruiterRecruitersPage/>
        </RecruiterProtectedRoute>
      }/>
      <Route path="/recruiter/payments" element={
        <RecruiterProtectedRoute>
          <RecruiterPaymentsPage/>
        </RecruiterProtectedRoute>
      }/>
      <Route path="/recruiter/settings" element={
        <RecruiterProtectedRoute>
          <RecruiterSettingsPage/>
        </RecruiterProtectedRoute>
      }/>
      <Route path="/recruiter" element={<LazyRoute><RecruiterLanding /></LazyRoute>}/>
      <Route path="/recruiters" element={<LazyRoute><RecruiterLanding /></LazyRoute>}/>
      
      {/* Admin Recruiter Pages */}
      <Route path="/admin/recruiters" element={
        <RequireAdmin><AdminRecruitersPage/></RequireAdmin>
      }/>
      <Route path="/admin/commissions" element={
        <RequireAdmin><AdminCommissionsPage/></RequireAdmin>
      }/>
      <Route path="/admin/payouts" element={
        <RequireAdmin><AdminPayoutsPage/></RequireAdmin>
      }/>
      <Route path="/for-homeowners" element={<LazyRoute><HomeownerLanding /></LazyRoute>}/>
      <Route path="/for-pros" element={<Navigate to="/pros" replace/>}/>
      <Route path="/for-professionals" element={<Navigate to="/pros" replace/>}/>
      <Route path="/terms" element={<Terms/>}/>
      <Route path="/privacy" element={<Privacy/>}/>
      <Route path="/privacy-policy" element={<Navigate to="/privacy" replace/>}/>
      <Route path="/privacy-settings" element={<PrivacySettings/>}/>
      <Route path="/success" element={<Success/>}/>
      <Route path="/about" element={<AboutPage/>}/>
      <Route path="/about-walter-arevalo" element={<AboutWalterArevaloPage/>}/>
      
      {/* Unified auth routes */}
      <Route path="/login/homeowner" element={<HomeownerLogin/>}/>
      <Route path="/login/pro" element={<ProLogin/>}/>
      <Route path="/login/recruiter" element={<RecruiterLogin/>}/>
      <Route path="/signup/homeowner" element={<HomeownerSignup/>}/>
      <Route path="/signup/pro" element={<ProSignup/>}/>
      <Route path="/signup/recruiter" element={<RecruiterSignup/>}/>
      <Route path="/forgot-password" element={<ForgotPassword/>}/>
      
      {/* Homeowner dashboard */}
      <Route path="/dashboard/homeowner" element={<CustomerPortalPage/>}/>
      
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    <footer className="border-t border-slate-200 mt-8 bg-white">
      <div className="container-xl py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-6">
          {/* About Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">About Fixlo</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><a href="/about" className="hover:text-brand">About Us</a></li>
              <li><a href="/how-it-works" className="hover:text-brand">How It Works</a></li>
              <li><a href="/contact" className="hover:text-brand">Contact</a></li>
            </ul>
          </div>
          
          {/* For Homeowners Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">For Homeowners</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><a href="/for-homeowners" className="hover:text-brand">Find a Pro</a></li>
              <li><a href="/request" className="hover:text-brand">Request a Service</a></li>
              <li><a href="/services" className="hover:text-brand">Browse Services</a></li>
              <li><a href="/my-jobs" className="hover:text-brand">My Jobs</a></li>
            </ul>
          </div>
          
          {/* For Professionals Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">For Professionals</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><a href="/pros" className="hover:text-brand">Join as a Pro</a></li>
              <li><a href="/pros/login" className="hover:text-brand">Pro Sign In</a></li>
              <li><a href="/how-it-works" className="hover:text-brand">How Fixlo Works</a></li>
            </ul>
          </div>
          
          {/* Popular Services Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Popular Services</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><a href="/us/services/plumbing" className="hover:text-brand">Plumbing</a></li>
              <li><a href="/us/services/electrical" className="hover:text-brand">Electrical</a></li>
              <li><a href="/us/services/hvac" className="hover:text-brand">HVAC</a></li>
              <li><a href="/us/services/house-cleaning" className="hover:text-brand">House Cleaning</a></li>
              <li><a href="/services" className="hover:text-brand">View All Services</a></li>
            </ul>
          </div>
          
          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><a href="/terms" className="hover:text-brand">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-brand">Privacy Policy</a></li>
              <li><a href="/privacy-settings" className="hover:text-brand">Privacy Settings</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 border-t border-slate-200 text-sm text-slate-700 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Fixlo. All rights reserved.</div>
          <div className="text-slate-600">
            Trusted home services marketplace serving the United States
          </div>
        </div>
      </div>
    </footer>
    <CookieConsent />
  </>);
}
