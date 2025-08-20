import React, { useState } from 'react';
import axios from 'axios';

export default function Signup(){
  const [form, setForm] = useState({ name:'', email:'', phone:'' });
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e)=>{
    e.preventDefault();
    setErr(''); setOk(false);
    try{
      await axios.post('/api/homeowner-lead', form);
      setOk(true);
    }catch(e){
      setErr('Could not submit. Please try again.');
    }
  };

  return (
    <div>
      <h2>Create your account</h2>
      <form onSubmit={submit}>
        <div><label>Name<br/>
          <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        </label></div>
        <div><label>Email<br/>
          <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        </label></div>
        <div><label>Phone<br/>
          <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required />
        </label></div>
        <button className="btn" type="submit">Sign up</button>
      </form>
      {ok && <p>Thanks! We’ll be in touch.</p>}
      {err && <p style={{color:'crimson'}}>{err}</p>}
    </div>
  );
}
