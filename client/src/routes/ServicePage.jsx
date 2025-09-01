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
      <div className="card p-5 mt-4">
        <p className="text-slate-300">Describe your job and get matched with vetted pros in {c ? c.replace(/-/g,' ') : 'your area'}.</p>
        <ServiceLeadForm service={s} city={c}/>
      </div>
    </div>
  </>);
}

function ServiceLeadForm({service, city}){
  const [form, setForm] = React.useState({name:'', phone:'', details:''});
  const api = import.meta.env.VITE_API_BASE || 'https://fixloapp.onrender.com';
  const submit = async (e)=>{ e.preventDefault();
    try{
      await fetch(`${api}/api/leads`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, service, city }) });
      alert('Thanks! We will text you shortly.');
    }catch(err){ alert('Submitted locally (demo). Connect backend to process.'); }
  };
  return (<form onSubmit={submit} className="mt-4 space-y-3">
    <div><label className="block text-sm text-slate-300">Name</label><input className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/></div>
    <div><label className="block text-sm text-slate-300">Phone</label><input className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required/></div>
    <div><label className="block text-sm text-slate-300">Job Details</label><textarea rows="4" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" value={form.details} onChange={e=>setForm({...form, details:e.target.value})} placeholder="Describe the issue or project..."></textarea></div>
    <div className="flex items-center gap-2">
      <input id="svc-city-sms" type="checkbox" className="h-4 w-4" required/>
      <label htmlFor="svc-city-sms" className="text-xs text-slate-400">I agree to receive SMS related to quotes, scheduling, and service updates. Reply STOP to unsubscribe.</label>
    </div>
    <div><button className="btn btn-primary">Request Quotes</button></div>
  </form>);
}
