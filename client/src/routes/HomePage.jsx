import React, { useState } from 'react';
import HelmetSEO from '../seo/HelmetSEO';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom';
export default function HomePage(){
  const [open, setOpen] = useState(false);
  return (<>
    <HelmetSEO title="Fixlo – Book Trusted Home Services Near You" />
    <div className="container">
      <div className="card">
        <h1>Welcome to Fixlo</h1>
        <p>Your one‑stop hub for finding trusted professionals and managing home projects effortlessly.</p>
        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
          <Link to="/services" className="btn">Select a Service</Link>
          <button className="btn ghost" onClick={()=>setOpen(true)}>Get Free Quote</button>
        </div>
      </div>
      <div style={{marginTop:24}} className="grid">
        {['Plumbing','Electrical','Carpentry','Painting','HVAC','Roofing','Landscaping','House Cleaning','Junk Removal'].map(s=>(
          <div className="card" key={s}>
            <h3>{s}</h3>
            <p className="small">Fast quotes • Background‑checked pros • SMS updates</p>
            <Link to={`/services/${s.toLowerCase().replace(/\s+/g,'-')}`} className="btn">Explore</Link>
          </div>
        ))}
      </div>
      <div className="card" style={{marginTop:24}}>
        <h2>Popular Cities</h2>
        <div className="grid" style={{marginTop:12}}>
          {[
            {s:'junk-removal', c:'miami-fl', label:'Junk Removal in Miami, FL'},
            {s:'house-cleaning', c:'charlotte-nc', label:'House Cleaning in Charlotte, NC'},
            {s:'plumbing', c:'dallas-tx', label:'Plumbing in Dallas, TX'},
            {s:'landscaping', c:'atlanta-ga', label:'Landscaping in Atlanta, GA'},
            {s:'electrical', c:'seattle-wa', label:'Electrical in Seattle, WA'},
            {s:'roofing', c:'boston-ma', label:'Roofing in Boston, MA'}
          ].map(item => (
            <div className="card" key={item.label}>
              <h3 style={{marginTop:0}}>{item.label}</h3>
              <a className="btn" href={`/services/${item.s}/${item.c}`}>Open</a>
            </div>
          ))}
        </div>
      </div>
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
  return (<form onSubmit={submit}>
    <label>Name</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/>
    <label>Phone</label><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required/>
    <label>Service</label>
    <select value={form.service} onChange={e=>setForm({...form, service:e.target.value})} required>
      <option value="">Select…</option>
      {['plumbing','electrical','carpentry','painting','hvac','roofing','landscaping','house-cleaning','junk-removal'].map(s=>(<option key={s} value={s}>{s}</option>))}
    </select>
    <label>City</label><input value={form.city} onChange={e=>setForm({...form, city:e.target.value})} required/>
    <div style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
      <input id="home-sms" type="checkbox" required/>
      <label htmlFor="home-sms" className="small">I agree to receive SMS related to quotes, scheduling, and service updates. Reply STOP to unsubscribe.</label>
    </div>
    <div style={{display:'flex', gap:12, marginTop:12}}><button className="btn" type="submit">Send</button></div>
  </form>);
}
