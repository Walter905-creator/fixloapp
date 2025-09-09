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
  const [form, setForm] = React.useState({name:'', phone:'', details:''});
  const api = import.meta.env.VITE_API_BASE || '';
  const submit = async (e)=>{ e.preventDefault();
    try{
      const url = `${api}/api/leads`;
      await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, service, city }) });
      alert('Thanks! We will text you shortly.');
    }catch(err){ alert('Submitted locally (demo). Connect backend to process.'); }
  };
  return (<form onSubmit={submit} className="space-y-3">
    <label className="block">
      <span className="text-slate-800">Name</span>
      <input className="mt-1 w-full rounded-xl" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
    </label>
    <label className="block">
      <span className="text-slate-800">Phone</span>
      <input type="tel" className="mt-1 w-full rounded-xl" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required/>
    </label>
    <label className="block">
      <span className="text-slate-800">Job Details</span>
      <textarea className="mt-1 w-full rounded-xl min-h-32" value={form.details} onChange={e=>setForm({...form, details:e.target.value})} placeholder="Describe the issue or project..."></textarea>
    </label>
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" className="rounded" required/>
      I agree to receive SMS related to quotes, scheduling, and service updates.
    </label>
    <button className="btn-primary w-full">Request Quotes</button>
  </form>);
}
