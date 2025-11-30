import React from 'react';
import { useParams } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { ServiceSchema } from '../seo/Schema';
import { makeTitle, makeDescription, slugify } from '../utils/seo';
import { API_BASE } from '../utils/config';

export default function ServicePage(){
  const { service, city } = useParams();
  const s = slugify(service || '');
  const c = city ? slugify(city) : undefined;
  const title = makeTitle({ service: s, city: c });
  const desc = makeDescription({ service: s, city: c });
  const canonical = `/services/${s}${c ? '/'+c : ''}`;
  
  // Format display names
  const serviceName = s ? s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Home Services';
  const cityName = c ? c.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'your area';
  
  return (<>
    <HelmetSEO title={title} description={desc} canonicalPathname={canonical} />
    <ServiceSchema service={s} city={c} />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      
      {/* Service Information Section */}
      <div className="card p-6 mt-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Professional {serviceName} Services in {cityName}</h2>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-700 mb-4">
            Looking for reliable {serviceName.toLowerCase()} professionals in {cityName}? Fixlo connects you with vetted, background-checked contractors who are ready to help with your project. Whether you need emergency repairs, routine maintenance, or a major renovation, our network of trusted professionals has you covered.
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">Why Choose Fixlo for {serviceName}?</h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li><strong>Background-Checked Professionals:</strong> Every contractor in our network undergoes thorough background screening to ensure your safety and peace of mind.</li>
            <li><strong>Fast Response Times:</strong> Get matched with available pros in {cityName} within minutes, not days. Most service requests receive responses within 24 hours.</li>
            <li><strong>Competitive Quotes:</strong> Compare quotes from multiple qualified professionals to find the best value for your {serviceName.toLowerCase()} project.</li>
            <li><strong>Real-Time Updates:</strong> Stay informed throughout the entire process with SMS notifications about your service request status.</li>
            <li><strong>Quality Guarantee:</strong> All professionals maintain high standards of workmanship and customer service to stay in our network.</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">How It Works</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-700">
            <li><strong>Submit Your Request:</strong> Tell us about your {serviceName.toLowerCase()} needs using the form below. The more details you provide, the better we can match you with the right professional.</li>
            <li><strong>Get Matched:</strong> We'll connect you with qualified {serviceName.toLowerCase()} professionals in {cityName} who are available to take on your project.</li>
            <li><strong>Compare & Choose:</strong> Review quotes and profiles from interested contractors, then select the one that best fits your needs and budget.</li>
            <li><strong>Schedule Service:</strong> Work directly with your chosen professional to schedule the service at a time that's convenient for you.</li>
          </ol>
          
          <p className="text-slate-700 mt-6">
            Ready to get started? Fill out the form below to receive quotes from trusted {serviceName.toLowerCase()} professionals in {cityName}. Our service is free for homeowners, and there's no obligation to hire.
          </p>
        </div>
      </div>
      
      {/* Service Request Form */}
      <div className="card p-6 mt-4">
        <h2 className="text-xl font-semibold mb-4">Request {serviceName} Service in {cityName}</h2>
        <p className="text-slate-700 mb-4">Describe your job and get matched with vetted pros in {cityName}.</p>
        <ServiceLeadForm service={s} city={c}/>
      </div>
    </div>
  </>);
}

function ServiceLeadForm({service, city}){
  const [form, setForm] = React.useState({
    serviceType: service ? service.replace(/-/g, ' ') : '',
    fullName: '', 
    phone: '', 
    city: city ? city.replace(/-/g, ' ') : '', 
    state: '', 
    details: '',
    smsConsent: false
  });
  
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  
  const api = API_BASE;

  // Phone validation helper
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/[^\d]/g, '');
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
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    
    setLoading(true);
    
    console.log('📱 Submitting service request:', { ...form, phone: '***-***-' + form.phone.slice(-4) });

    try {
      const url = `${api}/api/requests`;
      console.log('🔗 API URL:', url);
      
      // Use form values (which may be pre-populated from URL params but can be edited by user)
      const submissionData = {
        serviceType: form.serviceType.replace(/-/g, ' ') || service?.replace(/-/g, ' ') || '',
        fullName: form.fullName.trim(),
        phone: form.phone,
        city: form.city.replace(/-/g, ' ').trim(),
        state: form.state.trim().toUpperCase(),
        details: form.details.trim(),
        smsConsent: form.smsConsent
      };
      
      const res = await fetch(url, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(submissionData) 
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
        serviceType: service ? service.replace(/-/g, ' ') : '',
        fullName: '', 
        phone: '', 
        city: city ? city.replace(/-/g, ' ') : '', 
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Submitting...' : 'Get Matched with Pros'}
        </button>
      </form>
    </div>
  );
}
