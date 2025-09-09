import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function ProSignInPage(){
  const api = import.meta.env.VITE_API_BASE || '';
  async function submit(e){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = { email: form.get('email'), password: form.get('password') };
    try{
      const url = `${api}/api/auth/login`;
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
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
      <div className="card p-6">
        <form onSubmit={submit} className="space-y-3">
          <div><label className="block text-sm text-slate-800">Email</label><input name="email" className="mt-1 w-full rounded-xl" type="email" required/></div>
          <div><label className="block text-sm text-slate-800">Password</label><input name="password" className="mt-1 w-full rounded-xl" type="password" required/></div>
          <button className="btn-primary w-full">Sign In</button>
        </form>
      </div>
    </div>
  </>);
}
