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
    serviceType: service || '',
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
  
  // Phone validation helper
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/[^\d]/g, '');
    return cleaned.length >= 10;
  };
  
  const submit = async (e) => { 
    e.preventDefault();
    if (!form.smsConsent) {
      alert('Please agree to receive SMS updates to submit your request.');
      return;
    }
    
    if (!validatePhone(form.phone)) {
      alert('Please enter a valid phone number.');
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
    } finally {
      setLoading(false);
    }
  };

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