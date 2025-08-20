import React, { useState } from 'react';
import axios from 'axios';

export default function ProSignup(){
  const [form, setForm] = useState({ name:'', phone:'', trade:'' });
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e)=>{
    e.preventDefault();
    setErr(''); setOk(false);
    try{
      await axios.post('/api/pro-signup', form);
      setOk(true);
    }catch(e){
      setErr('Could not submit. Please try again.');
    }
  };

  return (
    <div>
      <h2>Join as a Pro</h2>
      <form onSubmit={submit}>
        <div><label>Name<br/>
          <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        </label></div>
        <div><label>Phone<br/>
          <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required />
        </label></div>
        <div><label>Trade<br/>
          <input value={form.trade} onChange={e=>setForm({...form, trade:e.target.value})} required />
        </label></div>
        <button className="btn" type="submit">Apply</button>
      </form>
      {ok && <p>Thanks! We’ll review and get back to you.</p>}
      {err && <p style={{color:'crimson'}}>{err}</p>}
    </div>
  );
}
