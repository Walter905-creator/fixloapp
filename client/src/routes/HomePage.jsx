import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';
import services from '../data/services.json';

const iconMap = {
  "Plumbing":"🔧",
  "Electrical":"⚡",
  "Carpentry":"🔨",
  "Painting":"🎨",
  "HVAC":"❄️",
  "Roofing":"🏠",
  "House Cleaning":"🧽",
  "Junk Removal":"🗑️",
  "Landscaping":"🌿"
};

export default function HomePage(){
  const [open, setOpen] = useState(false);
  return (<>
    <HelmetSEO title="Fixlo – Book Trusted Home Services Near You" />
    <div className="container-xl">
      {/* Hero */}
      <section className="py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Welcome to Fixlo</h1>
            <p className="mt-3 text-slate-300">Your one-stop hub for connecting with trusted home service professionals. From plumbing to electrical, we've got you covered.</p>
            <div className="mt-6 flex gap-3">
              <button className="btn btn-primary" onClick={()=>setOpen(true)}>Request Service</button>
              <Link to="/services" className="btn btn-ghost">Select a Service</Link>
            </div>
          </div>
          <div className="card p-6">
            <ul className="grid grid-cols-2 gap-3 text-sm text-slate-300">
              {[
                "Background Checked pros",
                "Real-time SMS updates",
                "AI Assistant guidance",
                "Secure Payments"
              ].map((b)=>(<li key={b} className="flex items-center gap-2">
                <span>✅</span><span>{b}</span>
              </li>))}
            </ul>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-4">
        <h2 className="text-xl font-bold mb-4">Services</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s=>(
            <div key={s} className="card p-5">
              <div className="text-3xl">{iconMap[s] || "🔧"}</div>
              <h3 className="mt-2 text-lg font-semibold">{s}</h3>
              <p className="text-sm text-slate-400 mt-1">
                {s==='Plumbing' && 'Fix leaks, install fixtures, and drain cleaning'}
                {s==='Electrical' && 'Safe wiring, outlets, and lighting installation'}
                {s==='Carpentry' && 'Custom builds, repairs, and woodworking'}
                {s==='Painting' && 'Interior and exterior painting services'}
                {s==='HVAC' && 'Heating, cooling, and ventilation services'}
                {s==='Roofing' && 'Roof repairs, installation, and inspection'}
                {s==='House Cleaning' && 'Professional home cleaning services'}
                {s==='Junk Removal' && 'Efficient junk and debris removal'}
                {s==='Landscaping' && 'Lawn care, gardening, and outdoor design'}
              </p>
              <div className="mt-4">
                <Link to={`/services/${s.toLowerCase().replace(/\s+/g,'-')}`} className="btn btn-primary">Explore</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Service Areas */}
      <section className="py-8">
        <h2 className="text-xl font-bold">Popular Service Areas</h2>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {[
            {city:'Miami',slug:'miami-fl'},
            {city:'New York',slug:'new-york-ny'},
            {city:'Los Angeles',slug:'los-angeles-ca'},
            {city:'Chicago',slug:'chicago-il'},
            {city:'Houston',slug:'houston-tx'},
            {city:'Phoenix',slug:'phoenix-az'},
          ].map(({city, slug})=>(
            <div key={slug} className="card p-4">
              <h3 className="font-semibold">{city}</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {['plumbing','electrical','hvac'].map(svc=>(
                  <Link key={svc} to={`/services/${svc}/${slug}`} className="pill">{svc} in {city}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits row */}
      <section className="py-6 grid md:grid-cols-4 gap-4">
        {[
          {icon:'✅', t:'Background Checked', d:'Verified professionals you can trust'},
          {icon:'📱', t:'Real-time SMS', d:'Instant notifications for new jobs'},
          {icon:'🤖', t:'AI Assistant', d:'Smart tools to grow your business'},
          {icon:'💳', t:'Secure Payments', d:'Fast, secure payment processing'}
        ].map((b)=>(
          <div key={b.t} className="card p-5">
            <div className="text-2xl">{b.icon}</div>
            <div className="mt-1 font-semibold">{b.t}</div>
            <div className="text-sm text-slate-400">{b.d}</div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="py-10 text-center">
        <h3 className="text-2xl font-extrabold">Join Fixlo's Professional Network</h3>
        <Link to="/join" className="btn btn-primary mt-4">Join Now</Link>
      </section>
    </div>

    <Modal open={open} onClose={()=>setOpen(false)} title="Request a Free Quote">
      <LeadForm/>
    </Modal>
  </>);
}

function LeadForm(){
  const [form, setForm] = React.useState({name:'', phone:'', service:'', city:''});
  const api = import.meta.env.VITE_API_BASE || 'https://fixloapp.onrender.com';
  const submit = async (e)=>{
    e.preventDefault();
    try{
      await fetch(`${api}/api/leads`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)});
      alert('Thanks! We will text you shortly.');
    }catch(err){ alert('Submitted locally (demo). Connect backend to process.'); }
  };
  return (<form onSubmit={submit} className="space-y-3">
    <div>
      <label className="block text-sm text-slate-300">Name</label>
      <input className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
    </div>
    <div>
      <label className="block text-sm text-slate-300">Phone</label>
      <input className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required/>
    </div>
    <div>
      <label className="block text-sm text-slate-300">Service</label>
      <select className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.service} onChange={e=>setForm({...form, service:e.target.value})} required>
        <option value="">Select…</option>
        {['plumbing','electrical','carpentry','painting','hvac','roofing','landscaping','house-cleaning','junk-removal'].map(s=>(
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm text-slate-300">City</label>
      <input className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} required/>
    </div>
    <div className="flex items-center gap-2">
      <input id="home-sms" type="checkbox" className="h-4 w-4" required/>
      <label htmlFor="home-sms" className="text-xs text-slate-400">I agree to receive SMS related to quotes, scheduling, and service updates. Reply STOP to unsubscribe.</label>
    </div>
    <div><button className="btn btn-primary">Send</button></div>
  </form>);
}
