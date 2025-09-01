import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function ProSignInPage(){
  return (<>
    <HelmetSEO title="Pro Sign In | Fixlo" canonicalPathname="/pro/sign-in" />
    <div className="container-xl py-8">
      <h1 className="text-2xl font-extrabold">Pro Sign In</h1>
      <div className="card p-5">
        <form onSubmit={(e)=>{e.preventDefault(); alert('Demo login. Connect backend.')}} className="space-y-3">
          <div><label className="block text-sm text-slate-300">Email</label><input className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" type="email" required/></div>
          <div><label className="block text-sm text-slate-300">Password</label><input className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2" type="password" required/></div>
          <button className="btn btn-primary">Sign In</button>
        </form>
      </div>
    </div>
  </>);
}
