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
  const [billingLoading, setBillingLoading] = React.useState(false);
  
  const displayName = user?.name || user?.phone || 'Pro User';
  
  function getToken() {
    return localStorage.getItem('fixlo_token') || '';
  }
  
  React.useEffect(()=>{
    async function load(){
      if(!api) { setLoaded(true); return; }
      const token = getToken();
      const authHeaders = token
        ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };

      try{
        // Try SaaS dashboard endpoint first (requires subscriptionActive)
        const dashRes = await fetch(`${api}/api/pro/dashboard`, {
          headers: authHeaders
        });

        if(dashRes.ok){
          const data = await dashRes.json();
          setProData(data);
          setLeads(Array.isArray(data.leads) ? data.leads : []);
          setSubscriptionActive(data.subscriptionActive);
        } else if(dashRes.status === 403){
          // Subscription inactive
          const data = await dashRes.json();
          setSubscriptionActive(false);
          setProData(data);
        } else {
          // Fall back to legacy dashboard
          const profileRes = await fetch(`${api}/api/pros/dashboard`, { credentials:'include', headers: authHeaders });
          if(profileRes.ok){
            const data = await profileRes.json();
            setProData(data.pro);
            setSubscriptionActive(data.pro?.paymentStatus === 'active' || data.pro?.subscriptionActive || false);
          }

          // Load leads from legacy endpoint
          const leadsRes = await fetch(`${api}/api/pros/leads`, { credentials:'include', headers: authHeaders });
          if(leadsRes.ok){
            const data = await leadsRes.json();
            setLeads(Array.isArray(data) ? data : (data?.leads || []));
          }
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
  
  async function handleUpdateNotifications(e){
    e.preventDefault();
    setSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const whatsappOptIn = formData.get('whatsappOptIn') === 'on';
    const wantsNotifications = formData.get('wantsNotifications') === 'on';
    
    try{
      const token = getToken();
      const res = await fetch(`${api}/api/pros/settings`, {
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
  
  return (<>
    <HelmetSEO title="Pro Dashboard | Fixlo" canonicalPathname="/pro/dashboard" robots="noindex, nofollow" />
    <div className="container-xl py-8">
      <div className="mb-4 p-4 bg-brand/10 rounded-lg flex justify-between items-center">
        <p className="text-sm font-semibold text-slate-700">
          Logged in as: <span className="text-brand">{displayName} (Pro)</span>
          {subscriptionActive !== null && (
            <span className={`ml-3 inline-block px-2 py-0.5 rounded text-xs font-semibold ${subscriptionActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {subscriptionActive ? 'Active' : 'Inactive'}
            </span>
          )}
        </p>
        <div className="flex gap-3 items-center">
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
      {subscriptionActive === false && (
        <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-xl">
          <h2 className="font-semibold text-red-900 mb-1">Subscription Inactive</h2>
          <p className="text-sm text-red-800 mb-3">
            Your subscription is inactive. Please renew to access leads.
          </p>
          <button
            onClick={openBillingPortal}
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
                  {l.description && <div className="text-xs text-slate-500 mt-1">{l.description}</div>}
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
    </div>
  </>);
}
