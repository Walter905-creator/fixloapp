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



 main
function ServiceLeadForm({service, city}){
  const [form, setForm] = React.useState({
    serviceType: service || '',
    fullName: '', 
    phone: '', 
    city: city || '', 
    state: '', 
    details: '',
    smsConsent: false
  });
  const api = import.meta.env.VITE_API_BASE || '';
  const submit = async (e)=>{ e.preventDefault();
    if (!form.smsConsent) {
      alert('Please agree to receive SMS updates to submit your request.');
      return;
    }
    try{
      const url = `${api}/api/leads`;
      const payload = {
        serviceType: service,
        fullName: form.name,
        phone: form.phone,
        description: form.details,
        city: city ? city.replace(/-/g, ' ') : '',
        state: '', // Could be enhanced to detect state from city
        smsConsent: form.smsConsent
      };
      const response = await fetch(url, { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify(payload) 
      });
      if (response.ok) {
        alert('Thanks! We will text you shortly.');
        setForm({name:'', phone:'', details:'', smsConsent: false});
      } else {
        alert('There was an error submitting your request. Please try again.');
      }
    }catch(err){ 
      console.error('Submit error:', err);
      alert('There was an error submitting your request. Please try again.'); 
    }

  const [form, setForm] = React.useState({
    fullName: '', 
    phone: '', 
    city: city || '',
    state: '',
 main

 main
    details: '',
 main
    smsConsent: false
  });
  
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  
  const api = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '';

  


 main
  // Phone validation helper
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/[^\d]/g, '');
    return cleaned.length >= 10;
  };
  
  const submit = async (e) => { 
    e.preventDefault();
 copilot/fix-7797c005-0d3a-44a8-b920-367533b5e812
    if (!form.smsConsent) {
      alert('Please agree to receive SMS updates to submit your request.');

    setError('');
    setSuccess(false);

    // Basic validation
    if (!form.fullName || !form.phone || !form.city || !form.state || !form.smsConsent) {
      setError('Please complete all required fields and consent to SMS updates.');
 main
      return;
    }
    
    if (!validatePhone(form.phone)) {
 copilot/fix-7797c005-0d3a-44a8-b920-367533b5e812
      alert('Please enter a valid phone number.');

      setError('Please enter a valid phone number (at least 10 digits).');
 main
      return;
    }
    
    setLoading(true);

    setError('');
    
    try{
      const url = `${api}/api/leads`;
      const payload = {
        serviceType: service,
        fullName: form.fullName,
        phone: form.phone,
        description: form.details,
        city: city ? city.replace(/-/g, ' ') : '',
        state: form.state,
        smsConsent: form.smsConsent
      };
      
      const response = await fetch(url, { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify(payload) 
      });
      
      if(response.ok){
        setSuccess(true);
        setForm({
          serviceType: service || '',
          fullName: '', 
          phone: '', 
          city: city || '', 
          state: '', 
          details: '', 
          smsConsent: false
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch(err) { 
      console.error('Submit error:', err);
      setError('There was an error submitting your request. Please try again.');


    console.log('📱 Submitting service request:', { ...form, phone: '***-***-' + form.phone.slice(-4) });

    try {
      const url = `${api}/api/requests`;
      console.log('🔗 API URL:', url);
      
      const res = await fetch(url, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(form) 
      });
      
      console.log('📡 Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }

      const result = await res.json();
      console.log('✅ Request submitted successfully:', result);
      
      setSuccess(true);
      
      // Reset form
      setForm({
        serviceType: service || '',
        fullName: '', 
        phone: '', 
        city: city || '', 
        state: '', 
        details: '',
        smsConsent: false
      });

      // Scroll success message into view
      setTimeout(() => {
        const successElement = document.querySelector('[data-success-message]');
        if (successElement) {
          successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

    } catch (err) {
      console.error('❌ Request submission error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
 main
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      {success && (
        <div data-success-message className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="font-medium">Thanks! We will text you shortly.</span>
          </div>
          <p className="mt-1 text-sm text-green-700">
            Your request has been submitted and matched professionals in your area will contact you soon.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-slate-800">Service Type *</span>
            <input 
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" 
              value={form.serviceType} 
              onChange={e=>setForm({...form, serviceType:e.target.value})} 
              placeholder="e.g., Plumbing"
              required
            />
          </label>
          <label className="block">
            <span className="text-slate-800">Full Name *</span>
            <input 
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" 
              value={form.fullName} 
              onChange={e=>setForm({...form, fullName:e.target.value})} 
              placeholder="Your full name"
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-slate-800">Phone *</span>
            <input 
              type="tel" 
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" 
              value={form.phone} 
              onChange={e=>setForm({...form, phone:e.target.value})} 
              placeholder="(555) 123-4567"
              required
            />
          </label>
          <label className="block">
            <span className="text-slate-800">City *</span>
            <input 
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" 
              value={form.city} 
              onChange={e=>setForm({...form, city:e.target.value})} 
              placeholder="Your city"
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="text-slate-800">State *</span>
          <input 
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" 
            value={form.state} 
            onChange={e=>setForm({...form, state:e.target.value})} 
            placeholder="Your state"
            maxLength="2"
            required
          />
        </label>

        <label className="block">
          <span className="text-slate-800">Job Details</span>
          <textarea 
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 min-h-32" 
            value={form.details} 
            onChange={e=>setForm({...form, details:e.target.value})} 
            placeholder="Describe the issue or project in detail..."
          ></textarea>
        </label>

        <label className="flex items-start gap-3 text-sm text-slate-700 p-3 bg-slate-50 rounded-xl">
          <input 
            type="checkbox" 
            className="rounded mt-0.5" 
            checked={form.smsConsent}
            onChange={e=>setForm({...form, smsConsent:e.target.checked})}
            required
          />
          <span>
            <span className="font-medium text-slate-800">I agree to receive SMS updates about my request. *</span>
            <br />
            <span className="text-xs text-slate-600">
              Reply STOP to unsubscribe. Message and data rates may apply.
            </span>
          </span>
        </label>
 main

  if(success) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-lg font-semibold mb-2">✓ Request Submitted!</div>
        <p className="text-slate-600 mb-4">We'll connect you with qualified professionals in your area.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Another Request
        </button>

      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => setForm({...form, fullName: e.target.value})}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({...form, phone: e.target.value})}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Project Details</label>
        <textarea
          value={form.details}
          onChange={(e) => setForm({...form, details: e.target.value})}
          className="w-full p-2 border rounded h-20"
          placeholder="Describe your project..."
          required
        />
      </div>
      
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="sms-consent"
          checked={form.smsConsent}
          onChange={(e) => setForm({...form, smsConsent: e.target.checked})}
          className="mt-1"
          required
        />
        <label htmlFor="sms-consent" className="text-sm text-slate-600">
          I agree to receive SMS updates about my service request and understand that message and data rates may apply.
        </label>
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Get Matched with Pros'}
      </button>
    </form>
  );
}

      </form>
    </div>
  );
} 
 main
