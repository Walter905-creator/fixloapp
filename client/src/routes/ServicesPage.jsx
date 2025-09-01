import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import Modal from '../components/Modal';
import services from '../data/services.json';
import { Link } from 'react-router-dom';
export default function ServicesPage(){
  const [open, setOpen] = useState(false);
  const [service, setService] = useState('');
  return (<>
    <HelmetSEO title="Services | Fixlo" canonicalPathname="/services" />
    <div className="container">
      <h1>Services</h1>
      <div className="grid">
        {services.map(s=>(
          <div className="card" key={s}>
            <h3>{s.replace(/-/g,' ').replace(/\b\w/g, c=>c.toUpperCase())}</h3>
            <p className="small">Find trusted {s.replace(/-/g,' ')} pros near you.</p>
            <div style={{display:'flex', gap:8}}>
              <button className="btn" onClick={()=>{setService(s); setOpen(true);}}>Get Quote</button>
              <Link className="btn ghost" to={`/services/${s}`}>Open Page</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Modal open={open} onClose={()=>setOpen(false)} title={`Get Quote – ${service}`}>
      <InlineLead service={service}/>
    </Modal>
  </>);
}
function InlineLead({service}){
  const [form, setForm] = React.useState({name:'', phone:'', city:''});
  const api = import.meta.env.VITE_API_BASE || 'https://fixloapp.onrender.com';
  const submit = async (e)=>{
    e.preventDefault();
    try{
      await fetch(`${api}/api/leads`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({...form, service}) });
      alert('Thanks! We will text you shortly.');
    }catch(err){ alert('Submitted locally (demo). Connect backend to process.'); }
  };
  return (<form onSubmit={submit}>
    <label>Name</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
    <label>Phone</label><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required/>
    <label>City</label><input value={form.city} onChange={e=>setForm({...form, city:e.target.value})} required/>
    <div style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
      <input id="svc-sms" type="checkbox" required/>
      <label htmlFor="svc-sms" className="small">I agree to receive SMS related to quotes, scheduling, and service updates. Reply STOP to unsubscribe.</label>
    </div>
    <div style={{display:'flex', gap:12, marginTop:12}}><button className="btn" type="submit">Send</button></div>
  </form>);
}
