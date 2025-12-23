import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HelmetSEO from '../seo/HelmetSEO';
import { API_BASE } from '../utils/config';

export default function ProSignInPage(){
  const api = API_BASE;
  const navigate = useNavigate();
  const { login } = useAuth();
  
  async function submit(e){
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = { email: form.get('email'), password: form.get('password') };
    try{
      const url = `${api}/api/pro-auth/login`;
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
      if(res.ok){
        const data = await res.json().catch(()=>({}));
        if(data?.token && data?.pro) {
          // Store auth data using AuthContext
          const userData = {
            role: 'pro',
            id: data.pro.id,
            name: data.pro.name,
            email: data.pro.email,
            trade: data.pro.trade,
            phone: data.pro.phone
          };
          login(data.token, userData);
          alert('Signed in successfully!');
          navigate('/pro/dashboard');
        } else {
          alert('Login failed - invalid response format.');
        }
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
