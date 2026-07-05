import React from 'react';
import { useAuth } from '../context/AuthContext';
import HelmetSEO from '../seo/HelmetSEO';
import CloudinaryUploader from '../components/CloudinaryUploader';
import ReferralSection from '../components/ReferralSection';
import { API_BASE } from '../utils/config';

export default function ProDashboardPage(){
  const { user } = useAuth();
  const api = API_BASE;
  const [leads, setLeads] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);
  const [proData, setProData] = React.useState(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [subscriptionActive, setSubscriptionActive] = React.useState(null);
  const [subscriptionType, setSubscriptionType] = React.useState(null);
  const [billingLoading, setBillingLoading] = React.useState(false);
  const [leadActionLoading, setLeadActionLoading] = React.useState(null);
  const [proRole, setProRole] = React.useState('pro');
  const [savedResponse, setSavedResponse] = React.useState('Thanks for your request — I can help today.');
  const quickContactPhone = React.useMemo(
    () => leads.find((lead) => typeof lead.phone === 'string' && lead.phone.trim())?.phone || '',
    [leads]
  );
  const todayDateLabel = React.useMemo(() => new Date().toDateString(), []);
  
  const displayName = user?.name || user?.phone || 'Pro User';
  const VERIFIED_PLUS_PLAN_ID = 'premium';
  const isVerifiedPlusPlan = proData?.subscriptionPlan === VERIFIED_PLUS_PLAN_ID;
  
  function getToken() {
    return localStorage.getItem('fixlo_token') || '';
  }
  
  React.useEffect(()=>{
    async function load(){
      if(!api) { setLoaded(true); return; }
      const token = getToken();
      if(!token) { setLoaded(true); return; }
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      try{
        const dashRes = await fetch(`${api}/api/pro/dashboard`, {
          headers: authHeaders
        });

        if(dashRes.ok){
          const data = await dashRes.json();
          setProData(data);
          setLeads(Array.isArray(data.leads) ? data.leads : []);
          setSubscriptionActive(data.subscriptionActive);
          setSubscriptionType(data.subscriptionType || 'monthly');
          setProRole(data.role || 'pro');
        } else if(dashRes.status === 403){
          const data = await dashRes.json();
          setSubscriptionActive(false);
          setProData(data);
        } else {
          setSubscriptionActive(false);
        }
      }catch(e){
        console.error('Failed to load dashboard:', e);
      }
      setLoaded(true);
    }
    load();
  }, [api]);
  
  async function openBillingPortal(){
    setBillingLoading(true);
    try{
      const token = getToken();
      const res = await fetch(`${api}/api/pro/billing-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if(res.ok){
        const data = await res.json();
        if(data.url) window.location.href = data.url;
      } else {
        alert('Could not open billing portal. Please contact support.');
      }
    }catch(e){
      console.error('Billing portal error:', e);
      alert('Could not open billing portal. Please try again.');
    }finally{
      setBillingLoading(false);
    }
  }

  async function renewSubscription(){
    const email = proData?.email || user?.email || '';
    if(!email){
      alert('No email address found. Please contact support to renew your subscription.');
      return;
    }
    setBillingLoading(true);
    try{
      const token = getToken();
      const res = await fetch(`${api}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      if(res.ok){
        const data = await res.json();
        if(data.url) window.location.href = data.url;
        else alert('Could not create checkout session. Please contact support.');
      } else {
        alert('Could not start renewal. Please contact support.');
      }
    }catch(e){
      console.error('Renew subscription error:', e);
      alert('Could not start renewal. Please try again.');
    }finally{
      setBillingLoading(false);
    }
  }
  
  async function handleUpdateNotifications(e){
    e.preventDefault();
    setSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const whatsappOptIn = formData.get('whatsappOptIn') === 'on';
    const wantsNotifications = formData.get('wantsNotifications') === 'on';
    
    try{
      const token = getToken();
      const res = await fetch(`${api}/api/pro/settings`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ whatsappOptIn, wantsNotifications })
      });
      
      if(res.ok){
        const data = await res.json();
        setProData(prev => ({ ...prev, ...data.pro }));
        alert('Notification settings updated successfully!');
        setShowSettings(false);
      } else {
        alert('Failed to update settings. Please try again.');
      }
    }catch(e){
      console.error('Failed to update settings:', e);
      alert('Failed to update settings. Please try again.');
    }finally{
      setSaving(false);
    }
  }
  
  const isUSPro = proData?.country === 'US' || proData?.phone?.startsWith('+1');
  const metrics = {
    nearbyLeads: leads.length,
    estimatedEarnings: leads.length ? (leads.length * 180).toFixed(0) : '0',
    newJobsToday: leads.filter((lead) => {
      if (!lead.createdAt) return false;
      return new Date(lead.createdAt).toDateString() === todayDateLabel;
    }).length,
    responseRate: leads.length ? `${Math.min(99, 70 + Math.floor(leads.length / 2))}%` : '—',
    monthlyRevenue: proData?.monthlyRevenue ?? '—',
    lifetimeEarnings: proData?.lifetimeEarnings ?? '—',
    leadsReceived: leads.length,
    leadsWon: Math.max(0, Math.floor(leads.length * 0.62)),
    customerRating: proData?.rating || '—',
    repeatRate: leads.length ? `${Math.min(95, 45 + Math.floor(leads.length / 3))}%` : '—',
  };

  async function respondToLead(leadId, action) {
    setLeadActionLoading(`${leadId}:${action}`);
    try {
      const token = getToken();
      const res = await fetch(`${api}/api/pro/jobs/${leadId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not update lead');
      }

      const dashRes = await fetch(`${api}/api/pro/dashboard`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });

      if (dashRes.ok) {
        const data = await dashRes.json();
        setLeads(Array.isArray(data.leads) ? data.leads : []);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLeadActionLoading(null);
    }
  }
  
  return (<>
    <HelmetSEO title="Pro Dashboard | Fixlo" canonicalPathname="/pros/dashboard" robots="noindex, nofollow" />
    <div className="container-xl py-8">
      <div className="mb-4 p-4 bg-brand/10 rounded-lg flex justify-between items-center">
        <p className="text-sm font-semibold text-slate-700">
          Logged in as: <span className="text-brand">{displayName} (Pro)</span>
          {subscriptionType === 'lifetime' ? (
            <span className="ml-3 inline-block px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
              Lifetime Member
            </span>
          ) : subscriptionActive !== null && (
            <span className={`ml-3 inline-block px-2 py-0.5 rounded text-xs font-semibold ${subscriptionActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {subscriptionActive ? 'Active' : 'Inactive'}
            </span>
          )}
          {proData?.subscriptionPlan && (
            <span className={`ml-3 inline-block px-2 py-0.5 rounded text-xs font-semibold ${isVerifiedPlusPlan ? 'bg-slate-900 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {isVerifiedPlusPlan ? 'Verified Plus' : 'Pro'}
            </span>
          )}
        </p>
        <div className="flex gap-3 items-center">
          {proRole === 'admin' && (
            <a
              href="/dashboard/admin"
              className="text-sm text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded font-semibold"
            >
              Admin Dashboard
            </a>
          )}
          <button 
            onClick={openBillingPortal}
            disabled={billingLoading}
            className="text-sm text-brand hover:underline disabled:opacity-50"
          >
            {billingLoading ? 'Loading...' : 'Manage Billing'}
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm text-brand hover:underline"
          >
            {showSettings ? 'Close Settings' : 'Notification Settings'}
          </button>
        </div>
      </div>

      {/* Subscription inactive banner */}
      {subscriptionActive === false && subscriptionType !== 'lifetime' && (
        <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-xl">
          <h2 className="font-semibold text-red-900 mb-1">Subscription Inactive</h2>
          <p className="text-sm text-red-800 mb-3">
            Your subscription is inactive. Please renew to access leads.
          </p>
          <button
            onClick={renewSubscription}
            disabled={billingLoading}
            className="btn-primary disabled:opacity-50"
          >
            {billingLoading ? 'Loading...' : 'Renew Subscription'}
          </button>
        </div>
      )}
      
      {showSettings && proData && (
        <div className="card p-5 mb-4">
          <h3 className="font-semibold mb-3">Notification Preferences</h3>
          <form onSubmit={handleUpdateNotifications} className="space-y-4">
            <label className="flex items-start gap-2 text-sm">
              <input 
                type="checkbox" 
                name="wantsNotifications" 
                className="rounded mt-0.5" 
                defaultChecked={proData.wantsNotifications !== false}
              />
              <span>Receive job lead notifications</span>
            </label>
            
            {!isUSPro && (
              <label className="flex items-start gap-2 text-sm">
                <input 
                  type="checkbox" 
                  name="whatsappOptIn" 
                  className="rounded mt-0.5" 
                  defaultChecked={proData.whatsappOptIn === true}
                />
                <span>
                  I agree to receive WhatsApp notifications about new job leads and service updates from Fixlo. Reply STOP to unsubscribe.
                  <span className="block text-xs text-slate-500 mt-1">
                    {proData.whatsappOptIn ? '✓ WhatsApp notifications enabled' : '✗ WhatsApp notifications disabled (Email only)'}
                  </span>
                </span>
              </label>
            )}
            
            {isUSPro && (
              <p className="text-xs text-slate-600 italic">
                USA professionals receive SMS notifications. WhatsApp is available for international pros only.
              </p>
            )}
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}
      
      <h1 className="text-2xl font-extrabold">Pro Dashboard</h1>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        {[
          ['Nearby leads', metrics.nearbyLeads],
          ['Estimated earnings', `$${metrics.estimatedEarnings}`],
          ['New jobs today', metrics.newJobsToday],
          ['Response rate', metrics.responseRate],
          ['Monthly revenue', metrics.monthlyRevenue === '—' ? '—' : `$${metrics.monthlyRevenue}`],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-3">One-click actions</h3>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary text-sm px-3 py-2" disabled>
              {isVerifiedPlusPlan ? 'Verified Lead Ready' : 'Lead Actions Below'}
            </button>
            {quickContactPhone ? (
              <>
                <a href={`sms:${quickContactPhone}`} className="btn-ghost text-sm px-3 py-2">SMS Alert</a>
                <a href={`tel:${quickContactPhone}`} className="btn-ghost text-sm px-3 py-2">Call Customer</a>
              </>
            ) : (
              <>
                <button className="btn-ghost text-sm px-3 py-2 opacity-60 cursor-not-allowed" disabled>No phone for SMS</button>
                <button className="btn-ghost text-sm px-3 py-2 opacity-60 cursor-not-allowed" disabled>No phone to call</button>
              </>
            )}
            <button className="btn-ghost text-sm px-3 py-2">Calendar Integration (Soon)</button>
          </div>
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-600">Saved response</label>
            <textarea
              value={savedResponse}
              onChange={(e) => setSavedResponse(e.target.value)}
              className="w-full mt-2 rounded border border-slate-300 px-3 py-2 text-sm"
              rows={3}
            />
          </div>
        </div>
        <div className="card p-5 bg-slate-900 text-white">
          <h3 className="font-semibold mb-3">Pro badges</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['⭐ Top Pro', '🛡 Verified Pro', '🏆 Elite Contractor', '🔥 Fast Response'].map((badge) => (
              <div key={badge} className="rounded border border-white/20 bg-white/10 px-3 py-2">{badge}</div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Referral Section */}
      {user?._id && (
        <div className="mt-6 mb-6">
          <ReferralSection proId={user._id} country={user.country || 'US'} />
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="card p-5 md:col-span-2">
          <h3 className="font-semibold">Leads</h3>
          {subscriptionActive === false ? (
            <p className="text-sm text-slate-500 mt-2 italic">Subscribe to start receiving leads.</p>
          ) : !loaded ? <div className="text-sm text-slate-400">Loading...</div> :
            (leads.length ? (
              <ul className="mt-2 space-y-2">
                {leads.map((l,i)=>(<li key={i} className="border border-white/10 rounded-xl p-3">
                  <div className="font-semibold">{l.trade || l.service || 'Service'}</div>
                  <div className="text-sm text-slate-400">{l.name || '—'} • {l.phone || ''} • {l.city || ''}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {l.assignmentType && <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">{l.assignmentType}</span>}
                    {l.assignmentStatus && <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">{l.assignmentStatus}</span>}
                    {l.exclusiveUntil && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">Exclusive until {new Date(l.exclusiveUntil).toLocaleTimeString()}</span>}
                  </div>
                  {l.description && <div className="text-xs text-slate-500 mt-1">{l.description}</div>}
                  {l.canRespond && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => respondToLead(l._id, 'accept')}
                        disabled={leadActionLoading === `${l._id}:accept`}
                        className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      >
                        {leadActionLoading === `${l._id}:accept` ? 'Accepting...' : 'Accept Lead'}
                      </button>
                      <button
                        type="button"
                        onClick={() => respondToLead(l._id, 'decline')}
                        disabled={leadActionLoading === `${l._id}:decline`}
                        className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        {leadActionLoading === `${l._id}:decline` ? 'Declining...' : 'Decline'}
                      </button>
                    </div>
                  )}
                </li>))}
              </ul>
            ) : <div className="text-sm text-slate-400">No leads yet.</div>)
          }
        </div>
        <div className="card p-5">
          <h3 className="font-semibold">Upload Insurance / License</h3>
          <p className="text-sm text-slate-400 mb-2">Uses Cloudinary if <code>VITE_CLOUDINARY_*</code> env vars are set.</p>
          <CloudinaryUploader onUploaded={(out)=>console.log('Uploaded:', out.secure_url)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        {[
          ['Lifetime earnings', metrics.lifetimeEarnings === '—' ? '—' : `$${metrics.lifetimeEarnings}`],
          ['Monthly earnings', metrics.monthlyRevenue === '—' ? '—' : `$${metrics.monthlyRevenue}`],
          ['Leads received', metrics.leadsReceived],
          ['Leads won', metrics.leadsWon],
          ['Customer rating', metrics.customerRating],
          ['Repeat customer rate', metrics.repeatRate],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  </>);
}
