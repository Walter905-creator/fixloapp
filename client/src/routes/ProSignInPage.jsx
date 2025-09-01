import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function ProSignInPage(){
  const api = import.meta.env.VITE_API_BASE || 'https://fixloapp.onrender.com';
  async function submit(e){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = { email: form.get('email'), password: form.get('password') };
    try{
      const res = await fetch(`${api}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
      if(res.ok){
        const data = await res.json().catch(()=>({}));
        if(data?.token) localStorage.setItem('fixlo_token', data.token);
        alert('Signed in. Opening dashboard...');
        window.location.href = '/pro/dashboard';
      }else{
        alert('Login failed (demo). Check backend.');
      }
    }catch(err){
      alert('Could not reach backend (demo).');
    }
  }
  return (<>
    <HelmetSEO title="Pro Sign In | Fixlo" canonicalPathname="/pro/sign-in" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Pro Sign In</h1>
      <div className="card p-5">
        <form onSubmit={submit} className="space-y-3">
          <div><label className="block text-sm text-slate-300">Email</label><input name="email" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" type="email" required/></div>
          <div><label className="block text-sm text-slate-300">Password</label><input name="password" className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" type="password" required/></div>
          <button className="btn btn-primary">Sign In</button>
        </form>
      </div>
    </div>
  </>);
}
