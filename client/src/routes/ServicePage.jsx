import React from 'react';
import { useParams } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { makeTitle, makeDescription, slugify } from '../utils/seo';
export default function ServicePage(){
  const { service, city } = useParams();
  const s = slugify(service || '');
  const c = city ? slugify(city) : undefined;
  const title = makeTitle({ service: s, city: c });
  const desc = makeDescription({ service: s, city: c });
  const canonical = `/services/${s}${c ? '/'+c : ''}`;
  return (<>
    <HelmetSEO title={title} description={desc} canonicalPathname={canonical} />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <div className="card p-6 mt-4">
        <p className="text-slate-700 mb-4">Describe your job and get matched with vetted pros in {c ? c.replace(/-/g,' ') : 'your area'}.</p>
        <ServiceLeadForm service={s} city={c}/>
      </div>
    </div>
  </>);
}
function ServiceLeadForm({service, city}){
  const [form, setForm] = React.useState({
    fullName: '', 
    phone: '', 
    city: city || '',
    state: '',
    details: '',
    smsConsent: false
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  
  const api = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';
  
  // Phone validation - allows E.164 format or (xxx) xxx-xxxx
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };
  
  const submit = async (e) => { 
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Basic validation
    if (!form.fullName || !form.phone || !form.city || !form.state || !form.smsConsent) {
      setError('Please complete all required fields and consent to SMS updates.');
      return;
    }

    if (!validatePhone(form.phone)) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        serviceType: service,
        fullName: form.fullName,
        phone: form.phone,
        city: form.city,
        state: form.state,
        details: form.details,
        smsConsent: form.smsConsent
      };
      
      console.log('Submitting service request:', payload);
      
      const res = await fetch(`${api}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Request failed (${res.status})`);
      }
      
      setSuccess(true);
      // Clear form on success
      setForm({
        fullName: '', 
        phone: '', 
        city: city || '',
        state: '',
        details: '',
        smsConsent: false
      });
      
      // Scroll success message into view
      setTimeout(() => {
        const successElement = document.querySelector('.success-message');
        if (successElement) {
          successElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
    } catch (err) {
      console.error('Request error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="success-message bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <div className="text-green-800 font-semibold mb-2">Thanks! We will text you shortly.</div>
        <div className="text-green-600 text-sm">We've received your request and will connect you with qualified professionals in your area.</div>
      </div>
    );
  }
  
  return (<form onSubmit={submit} className="space-y-3">
    <label className="block">
      <span className="text-slate-800">Full Name *</span>
      <input 
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2" 
        value={form.fullName} 
        onChange={e=>setForm({...form, fullName:e.target.value})} 
        required
        disabled={loading}
      />
    </label>
    <label className="block">
      <span className="text-slate-800">Phone *</span>
      <input 
        type="tel" 
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2" 
        value={form.phone} 
        onChange={e=>setForm({...form, phone:e.target.value})} 
        placeholder="(555) 123-4567"
        required
        disabled={loading}
      />
    </label>
    <div className="grid grid-cols-2 gap-3">
      <label className="block">
        <span className="text-slate-800">City *</span>
        <input 
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2" 
          value={form.city} 
          onChange={e=>setForm({...form, city:e.target.value})} 
          required
          disabled={loading}
        />
      </label>
      <label className="block">
        <span className="text-slate-800">State *</span>
        <input 
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2" 
          value={form.state} 
          onChange={e=>setForm({...form, state:e.target.value})} 
          placeholder="e.g. FL"
          maxLength="2"
          required
          disabled={loading}
        />
      </label>
    </div>
    <label className="block">
      <span className="text-slate-800">Job Details</span>
      <textarea 
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 min-h-32" 
        value={form.details} 
        onChange={e=>setForm({...form, details:e.target.value})} 
        placeholder="Describe the issue or project..."
        disabled={loading}
      ></textarea>
    </label>
    <label className="flex items-start gap-2 text-sm text-slate-700">
      <input 
        type="checkbox" 
        className="rounded mt-1" 
        checked={form.smsConsent}
        onChange={e=>setForm({...form, smsConsent:e.target.checked})}
        required
        disabled={loading}
      />
      <span>I agree to receive SMS updates about my request. Reply STOP to unsubscribe. *</span>
    </label>
    
    {error && (
      <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-xl text-sm">
        {error}
      </div>
    )}
    
    <button 
      type="submit"
      className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={loading}
    >
      {loading ? 'Submitting...' : 'Request Quotes'}
    </button>
  </form>);
}
