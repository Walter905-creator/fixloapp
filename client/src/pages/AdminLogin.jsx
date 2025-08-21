import { useState } from 'react';
import { postJSON } from '../lib/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [err,setErr] = useState('');

  async function onSubmit(e){
    e.preventDefault();
    setErr('');
    try{
      const { token } = await postJSON('/auth/login', { email, password });
      localStorage.setItem('fixlo_admin_token', token);
      window.location.href='/admin';
    }catch(e){ setErr('Login failed');}
  }

  return (
    <div className="container" style={{padding:'3rem 0'}}>
      <h1 className="text-2xl font-bold mb-4">Admin sign in</h1>
      {err && <div className="text-red-600 mb-2">{err}</div>}
      <form onSubmit={onSubmit} className="grid gap-3 max-w-sm">
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="btn btn-primary">Sign in</button>
      </form>
    </div>
  );
}