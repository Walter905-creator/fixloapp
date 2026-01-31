import React from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import HreflangTags from '../seo/HreflangTags';
import { ServiceSchema } from '../seo/Schema';
import { makeTitle, makeDescription, slugify } from '../utils/seo';
import { API_BASE, IS_HOLIDAY_SEASON } from '../utils/config';

// Supported countries for international SEO
const SUPPORTED_COUNTRIES = ['us', 'ca', 'uk', 'au', 'ar'];

// Country configuration
const COUNTRY_CONFIG = {
  us: { code: 'us', name: 'United States', servicesPath: 'services' },
  ca: { code: 'ca', name: 'Canada', servicesPath: 'services' },
  uk: { code: 'uk', name: 'United Kingdom', servicesPath: 'services' },
  au: { code: 'au', name: 'Australia', servicesPath: 'services' },
  ar: { code: 'ar', name: 'Argentina', servicesPath: 'servicios' }
};

// Holiday-specific service benefits
const holidayBenefits = {
  'house-cleaning': 'Holiday deep cleaning to impress your guests',
  'cleaning': 'Holiday deep cleaning to impress your guests',
  'electrical': 'Christmas light installation and holiday electrical safety',
  'landscaping': 'Professional holiday decoration setup and winter prep',
  'plumbing': 'Emergency winter repairs to avoid holiday disasters',
  'hvac': 'Keep your home warm for holiday gatherings',
  'handyman': 'Get those repairs done before family arrives',
  'carpentry': 'Home improvements ready for the holiday season',
  'painting': 'Fresh paint to make your home shine this Christmas',
  'roofing': 'Winter roof repairs and ice dam prevention',
  'junk-removal': 'Clear out clutter before holiday decorating'
};

// Related services mapping for internal linking
const relatedServices = {
  'plumbing': ['hvac', 'electrical', 'handyman'],
  'electrical': ['plumbing', 'hvac', 'carpentry'],
  'hvac': ['plumbing', 'electrical', 'roofing'],
  'carpentry': ['electrical', 'painting', 'handyman'],
  'painting': ['carpentry', 'handyman', 'cleaning'],
  'roofing': ['hvac', 'carpentry', 'handyman'],
  'house-cleaning': ['junk-removal', 'landscaping', 'handyman'],
  'cleaning': ['junk-removal', 'landscaping', 'handyman'],
  'junk-removal': ['cleaning', 'landscaping', 'handyman'],
  'landscaping': ['junk-removal', 'cleaning', 'handyman'],
  'handyman': ['plumbing', 'electrical', 'carpentry']
};

// Format service name for display
function formatServiceName(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// City-specific content to reduce duplicate content signals
const citySpecificContent = {
  'miami': {
    intro: 'Miami\'s tropical climate and coastal location create unique home maintenance needs. From hurricane preparedness to humidity control, local professionals understand the specific challenges South Florida homeowners face.',
    pricing: 'Competitive rates reflecting Miami\'s diverse neighborhoods, from Brickell high-rises to Coral Gables estates.',
    trust: 'Serving Miami-Dade County with bilingual professionals who understand both English and Spanish-speaking communities.'
  },
  'new-york': {
    intro: 'New York City\'s diverse boroughs and historic buildings require experienced professionals who navigate complex building codes and co-op board requirements with ease.',
    pricing: 'Transparent pricing for all five boroughs, with professionals experienced in Manhattan apartments, Brooklyn brownstones, and Queens multi-family homes.',
    trust: 'Licensed contractors familiar with NYC Department of Buildings regulations and landmark preservation requirements.'
  },
  'los-angeles': {
    intro: 'Los Angeles\' sprawling metro area spans from beach communities to valley suburbs, each with distinct architecture and climate considerations.',
    pricing: 'Fair pricing across LA County, from Santa Monica to Pasadena, with professionals who understand California building standards.',
    trust: 'Licensed, bonded contractors familiar with California\'s strict seismic safety codes and energy efficiency requirements.'
  },
  'chicago': {
    intro: 'Chicago\'s extreme weather—from harsh winters to humid summers—demands reliable home systems and experienced professionals who can handle seasonal challenges.',
    pricing: 'Competitive rates for Chicagoland area homes, from downtown condos to suburban single-family residences.',
    trust: 'Experienced professionals who understand Chicago\'s unique building codes and the challenges of older construction in historic neighborhoods.'
  },
  'houston': {
    intro: 'Houston\'s humid subtropical climate and rapid growth require professionals experienced with modern construction and climate-appropriate solutions.',
    pricing: 'Affordable rates across Greater Houston, from inner loop neighborhoods to suburban communities in Harris and Fort Bend counties.',
    trust: 'Licensed Texas contractors who prioritize energy efficiency and moisture control in the Gulf Coast climate.'
  },
  'phoenix': {
    intro: 'Phoenix\'s extreme heat and desert climate create specific demands for cooling systems, landscaping, and outdoor living spaces.',
    pricing: 'Competitive pricing throughout the Valley of the Sun, from Scottsdale to Glendale, with specialists in desert-climate solutions.',
    trust: 'Arizona-licensed professionals experienced in water conservation, heat management, and desert landscaping requirements.'
  },
  'austin': {
    intro: 'Austin\'s booming tech scene and rapid growth have created demand for professionals who work efficiently in both established and newly developed neighborhoods.',
    pricing: 'Fair rates across Austin metro area, from downtown condos to suburban homes in Round Rock and Cedar Park.',
    trust: 'Texas-licensed professionals familiar with Austin\'s unique building requirements and commitment to energy efficiency.'
  },
  'atlanta': {
    intro: 'Atlanta\'s humid subtropical climate and diverse neighborhoods require experienced professionals who understand both historic preservation and modern construction.',
    pricing: 'Competitive pricing throughout Metro Atlanta, from Midtown high-rises to suburban communities in Fulton and Cobb counties.',
    trust: 'Georgia-licensed contractors experienced with the region\'s clay soil conditions and humidity challenges.'
  },
  'seattle': {
    intro: 'Seattle\'s rainy climate and hilly terrain create unique challenges for roofing, drainage, and moisture control that local professionals navigate expertly.',
    pricing: 'Transparent pricing across Seattle metro area, from Capitol Hill apartments to Eastside suburban homes.',
    trust: 'Washington-licensed contractors familiar with the Pacific Northwest\'s moisture management and seismic requirements.'
  },
  'boston': {
    intro: 'Boston\'s historic architecture and harsh New England winters require specialists who respect preservation standards while ensuring modern comfort.',
    pricing: 'Competitive rates across Greater Boston, from Back Bay brownstones to suburban homes in Cambridge and Brookline.',
    trust: 'Massachusetts-licensed professionals experienced with historic building codes and cold climate construction requirements.'
  },
  'dallas': {
    intro: 'Dallas\' hot summers and occasional winter storms demand reliable home systems and professionals who can handle Texas\' variable weather.',
    pricing: 'Fair pricing throughout DFW Metroplex, from Dallas urban neighborhoods to suburbs in Plano, Frisco, and Fort Worth.',
    trust: 'Texas-licensed contractors experienced with energy-efficient cooling solutions and the region\'s clay soil foundation challenges.'
  },
  'san-diego': {
    intro: 'San Diego\'s mild climate and coastal location create ideal conditions for outdoor living, but also require attention to moisture and salt air effects.',
    pricing: 'Competitive rates across San Diego County, from downtown to coastal communities and inland suburbs.',
    trust: 'California-licensed professionals familiar with coastal building codes and energy efficiency standards.'
  },
  'denver': {
    intro: 'Denver\'s high altitude, intense sun, and dramatic temperature swings require professionals experienced with Colorado\'s unique environmental conditions.',
    pricing: 'Fair pricing throughout Metro Denver, from downtown lofts to mountain-adjacent suburbs in Aurora and Lakewood.',
    trust: 'Colorado-licensed contractors who understand high-altitude HVAC requirements and rapid weather changes.'
  },
  'philadelphia': {
    intro: 'Philadelphia\'s rich history and diverse housing stock—from colonial homes to modern apartments—requires versatile, knowledgeable professionals.',
    pricing: 'Competitive rates across Philadelphia metro area, from Center City to suburbs in Delaware and Montgomery counties.',
    trust: 'Pennsylvania-licensed contractors experienced with historic preservation and the city\'s rowhouse construction.'
  },
  'san-antonio': {
    intro: 'San Antonio\'s hot climate and historic missions require professionals who balance modern efficiency with respect for the city\'s cultural heritage.',
    pricing: 'Affordable rates throughout San Antonio metro area, from downtown to suburbs in Bexar County.',
    trust: 'Texas-licensed professionals experienced with energy-efficient cooling and the region\'s limestone foundation conditions.'
  },
  'san-francisco': {
    intro: 'San Francisco\'s microclimates, seismic requirements, and Victorian architecture demand highly specialized professional expertise.',
    pricing: 'Transparent pricing across San Francisco Bay Area, reflecting the region\'s high standards and complex building codes.',
    trust: 'California-licensed contractors experienced with seismic retrofitting, historic preservation, and strict city regulations.'
  }
};

// Get city-specific content, with generic fallback
function getCityContent(city) {
  if (!city) {
    return {
      intro: 'Local professionals in your area understand the unique needs of your community and are ready to help with your home service needs.',
      pricing: 'Competitive pricing from vetted professionals who provide transparent quotes.',
      trust: 'All contractors in our network are background-checked and maintain high standards of workmanship.'
    };
  }
  
  return citySpecificContent[city] || {
    intro: `Local professionals in ${formatServiceName(city)} are experienced with the area's specific needs and building requirements.`,
    pricing: `Competitive rates from trusted professionals serving ${formatServiceName(city)} and surrounding areas.`,
    trust: `Licensed, background-checked contractors familiar with ${formatServiceName(city)}'s local codes and regulations.`
  };
}


export default function ServicePage({ legacy = false }){
  const { country, service, city } = useParams();
  const location = useLocation();
  
  // Handle legacy routes - redirect to US country path
  if (legacy) {
    const s = slugify(service || '');
    const c = city ? slugify(city) : undefined;
    const redirectPath = `/us/services/${s}${c ? '/' + c : ''}`;
    return <Navigate to={redirectPath} replace />;
  }
  
  // Validate country parameter
  const countryCode = country ? country.toLowerCase() : 'us';
  if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
    // Invalid country - redirect to US
    const s = slugify(service || '');
    const c = city ? slugify(city) : undefined;
    return <Navigate to={`/us/services/${s}${c ? '/' + c : ''}`} replace />;
  }
  
  const countryInfo = COUNTRY_CONFIG[countryCode];
  const s = slugify(service || '');
  const c = city ? slugify(city) : undefined;
  const title = makeTitle({ service: s, city: c, country: countryCode });
  const desc = makeDescription({ service: s, city: c, country: countryCode });
  const canonical = `/${countryCode}/${countryInfo.servicesPath}/${s}${c ? '/'+c : ''}`;
  
  // Format display names
  const serviceName = s ? s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Home Services';
  const cityName = c ? c.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'your area';
  
  // Get city-specific content for uniqueness
  const cityContent = getCityContent(c);
  
  return (<>
    <HelmetSEO title={title} description={desc} canonicalPathname={canonical} />
    <HreflangTags service={s} city={c} />
    <ServiceSchema service={s} city={c} country={countryCode} />
    <div className="container-xl py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 text-sm text-slate-600" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="hover:text-brand">Home</Link>
          </li>
          <li>&rsaquo;</li>
          <li>
            <Link to="/services" className="hover:text-brand">Services</Link>
          </li>
          <li>&rsaquo;</li>
          <li>
            <Link to={`/${countryCode}/${countryInfo.servicesPath}/${s}`} className="hover:text-brand">{serviceName}</Link>
          </li>
          {c && (
            <>
              <li>&rsaquo;</li>
              <li className="text-slate-900 font-medium">{cityName}</li>
            </>
          )}
        </ol>
      </nav>
      
      <h1 className="text-2xl font-extrabold">{title}</h1>
      
      {/* Holiday Banner */}
      {IS_HOLIDAY_SEASON && (
        <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-green-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎄</span>
            <div>
              <h3 className="font-semibold text-slate-900">Holiday Season Special</h3>
              <p className="text-sm text-slate-700 mt-1">
                {holidayBenefits[s] || 'Get your home ready for the holidays – book trusted professionals today!'}
                {' '}¡Prepara tu hogar para Navidad!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Service Information Section */}
      <div className="card p-6 mt-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Professional {serviceName} Services in {cityName}
          {IS_HOLIDAY_SEASON && ' – Holiday & Seasonal Repairs'}
        </h2>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-700 mb-4">
            Looking for reliable {serviceName.toLowerCase()} professionals in {cityName}? Fixlo connects you with vetted, background-checked contractors who are ready to help with your project. 
            {IS_HOLIDAY_SEASON && (
              <> Whether you need <strong>emergency holiday repairs</strong>, <strong>Christmas home services</strong>, <strong>winter maintenance</strong>, or preparations for holiday visitors, our network of trusted professionals has you covered. 
              <span className="text-slate-600 italic"> Servicios del hogar para la temporada navideña.</span></>
            )}
            {!IS_HOLIDAY_SEASON && ' Whether you need emergency repairs, routine maintenance, or a major renovation, our network of trusted professionals has you covered.'}
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">
            Why Choose Fixlo for {serviceName}?
            {IS_HOLIDAY_SEASON && ' This Holiday Season'}
          </h3>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li><strong>Background-Checked Professionals:</strong> Every contractor in our network undergoes thorough background screening to ensure your safety and peace of mind.</li>
            <li><strong>Fast Response Times:</strong> Get matched with available pros in {cityName} within minutes, not days. Most service requests receive responses within 24 hours{IS_HOLIDAY_SEASON ? ' – perfect for urgent holiday preparations' : ''}.</li>
            <li><strong>Competitive Quotes:</strong> Compare quotes from multiple qualified professionals to find the best value for your {serviceName.toLowerCase()} project.</li>
            {IS_HOLIDAY_SEASON && (
              <li><strong>Holiday Availability:</strong> Our professionals work around your busy holiday schedule to ensure timely completion before your guests arrive.</li>
            )}
            <li><strong>Real-Time Updates:</strong> Stay informed throughout the entire process with SMS notifications about your service request status.</li>
            <li><strong>Quality Guarantee:</strong> All professionals maintain high standards of workmanship and customer service to stay in our network.</li>
          </ul>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">How It Works</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-700">
            <li><strong>Submit Your Request:</strong> Tell us about your {serviceName.toLowerCase()} needs using the form below. The more details you provide, the better we can match you with the right professional.</li>
            <li><strong>Get Matched:</strong> We'll connect you with qualified {serviceName.toLowerCase()} professionals in {cityName} who are available to take on your project{IS_HOLIDAY_SEASON ? ' and can work within your holiday timeline' : ''}.</li>
            <li><strong>Compare & Choose:</strong> Review quotes and profiles from interested contractors, then select the one that best fits your needs and budget.</li>
            <li><strong>Schedule Service:</strong> Work directly with your chosen professional to schedule the service at a time that's convenient for you.</li>
          </ol>
          
          <p className="text-slate-700 mt-6">
            {IS_HOLIDAY_SEASON ? (
              <>
                <strong>Get your home ready for the holidays!</strong> Fill out the form below to receive quotes from trusted {serviceName.toLowerCase()} professionals in {cityName}. 
                Our service is free for homeowners, and there's no obligation to hire. 
                <span className="italic text-slate-600"> ¡Haz que tu casa esté lista para Navidad – reserva ahora!</span>
              </>
            ) : (
              <>Ready to get started? Fill out the form below to receive quotes from trusted {serviceName.toLowerCase()} professionals in {cityName}. Our service is free for homeowners, and there's no obligation to hire.</>
            )}
          </p>
        </div>
      </div>
      
      {/* City-Specific Local Context - Reduces duplicate content signals */}
      {c && (
        <div className="card p-6 mt-6 mb-6 bg-slate-50 border-l-4 border-brand">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">
            {serviceName} Services in {cityName}: Local Expertise
          </h3>
          <div className="space-y-4 text-slate-700">
            <p className="leading-relaxed">
              <strong>Why Local Matters:</strong> {cityContent.intro}
            </p>
            <p className="leading-relaxed">
              <strong>Pricing & Value:</strong> {cityContent.pricing}
            </p>
            <p className="leading-relaxed">
              <strong>Trust & Credentials:</strong> {cityContent.trust}
            </p>
          </div>
        </div>
      )}
      
      {/* Testimonial Section for Trust */}
      <div className="card p-6 mt-6 mb-6 bg-gradient-to-r from-emerald-50 to-blue-50">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">What Customers Are Saying</h3>
        <div className="space-y-4">
          <blockquote className="border-l-4 border-emerald-600 pl-4">
            <p className="text-slate-700 italic mb-2">
              "Found a reliable {serviceName.toLowerCase()} professional through Fixlo in less than 24 hours. The background check gave me peace of mind, and the pricing was transparent from the start."
            </p>
            <cite className="text-sm text-slate-600 not-italic">— Sarah M., Homeowner</cite>
          </blockquote>
          
          <blockquote className="border-l-4 border-emerald-600 pl-4">
            <p className="text-slate-700 italic mb-2">
              "As a {serviceName.toLowerCase()} contractor, Fixlo has transformed my business. No more paying for leads that go nowhere. The flat monthly fee means I can actually predict my costs."
            </p>
            <cite className="text-sm text-slate-600 not-italic">— Mike T., Professional Contractor</cite>
          </blockquote>
        </div>
      </div>
      
      {/* Service Request Form */}
      <div className="card p-6 mt-4">
        <h2 className="text-xl font-semibold mb-4">
          Request {serviceName} Service in {cityName}
          {IS_HOLIDAY_SEASON && ' – Holiday Scheduling Available'}
        </h2>
        <p className="text-slate-700 mb-4">
          Describe your job and get matched with vetted pros in {cityName}.
          {IS_HOLIDAY_SEASON && (
            <span className="block mt-2 text-sm font-medium text-red-700">
              🎁 Fast turnaround for holiday projects! Most requests matched within 24 hours.
            </span>
          )}
        </p>
        <ServiceLeadForm service={s} city={c}/>
      </div>
      
      {/* Related Services */}
      {relatedServices[s] && (
        <div className="card p-6 mt-4">
          <h2 className="text-xl font-semibold mb-4">Related Services</h2>
          <p className="text-sm text-slate-600 mb-4">
            Looking for other home services? We can help with these too:
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {relatedServices[s].map(relatedService => (
              <Link
                key={relatedService}
                to={c ? `/${countryCode}/${countryInfo.servicesPath}/${relatedService}/${c}` : `/${countryCode}/${countryInfo.servicesPath}/${relatedService}`}
                className="text-brand hover:underline font-medium"
              >
                {formatServiceName(relatedService)} {c && `in ${cityName}`}
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Link to="/services" className="text-brand hover:underline font-medium">
              View All Services →
            </Link>
          </div>
        </div>
      )}
      
      {/* Trust & Support Links */}
      <div className="card p-6 mt-4 bg-slate-50">
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <Link to="/how-it-works" className="text-sm text-slate-700 hover:text-brand">
            <div className="font-semibold mb-1">How It Works</div>
            <div className="text-xs">Learn about our process</div>
          </Link>
          <Link to="/join" className="text-sm text-slate-700 hover:text-brand">
            <div className="font-semibold mb-1">For Professionals</div>
            <div className="text-xs">Join our network</div>
          </Link>
          <Link to="/contact" className="text-sm text-slate-700 hover:text-brand">
            <div className="font-semibold mb-1">Contact Support</div>
            <div className="text-xs">We're here to help</div>
          </Link>
        </div>
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

    // Frontend validation guard - match backend requirements exactly
    if (!service || !form.fullName || !form.phone || !form.city || !form.state) {
      setError('Please fill out all required fields.');
      return;
    }
    
    if (!form.smsConsent) {
      setError('Please consent to SMS updates to continue.');
      return;
    }
    
    if (!validatePhone(form.phone)) {
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    
    setLoading(true);
    
    // Prepare payload matching backend API contract exactly
    const payload = {
      serviceType: service,
      fullName: form.fullName,
      phone: form.phone,
      city: form.city || (city ? city.replace(/-/g, ' ') : ''),
      state: form.state,
      details: form.details || '',
      smsConsent: form.smsConsent === true
    };
    
    console.log('🚀 Sending service request payload:', payload);

    try {
      const url = `${api}/api/requests`;
      console.log('🔗 API URL:', url);
      
      const res = await fetch(url, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(payload)
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
          {loading ? 'Submitting...' : IS_HOLIDAY_SEASON ? 'Get Holiday-Ready – Match with Pros Now!' : 'Get Matched with Pros'}
        </button>
      </form>
    </div>
  );
}
