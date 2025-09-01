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
    <div className="container">
      <h1>{title}</h1>
      <div className="card">
        <p>Describe your job and get matched with vetted pros in {c ? c.replace(/-/g,' ') : 'your area'}.</p>
        <ServiceLeadForm service={s} city={c}/>
      </div>
    </div>
  </>);
}
function ServiceLeadForm({service, city}){
  const [form, setForm] = React.useState({name:'', phone:'', details:''});
  const api = import.meta.env.VITE_API_BASE || 'https://fixloapp.onrender.com';
  const submit = async (e)=>{
    e.preventDefault();
    try{
      await fetch(`${api}/api/leads`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, service, city }) });
      alert('Thanks! We will text you shortly.');
    }catch(err){ alert('Submitted locally (demo). Connect backend to process.'); }
  };
  return (<form onSubmit={submit}>
    <label>Name</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
    <label>Phone</label><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required/>
    <label>Job Details</label><textarea rows="4" value={form.details} onChange={e=>setForm({...form, details:e.target.value})} placeholder="Describe the issue or project..."></textarea>
    <div style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
      <input id="svc-city-sms" type="checkbox" required/>
      <label htmlFor="svc-city-sms" className="small">I agree to receive SMS related to quotes, scheduling, and service updates. Reply STOP to unsubscribe.</label>
    </div>
    <div style={{display:'flex', gap:12, marginTop:12}}><button className="btn">Request Quotes</button></div>
  </form>);
}
