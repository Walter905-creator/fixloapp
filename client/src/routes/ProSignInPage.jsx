import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function ProSignInPage(){
  return (<>
    <HelmetSEO title="Pro Sign In | Fixlo" canonicalPathname="/pro/sign-in" />
    <div className="container">
      <h1>Pro Sign In</h1>
      <div className="card">
        <form onSubmit={(e)=>{e.preventDefault(); alert('Demo login. Connect backend.')}}>
          <label>Email</label><input type="email" required/>
          <label>Password</label><input type="password" required/>
          <div style={{marginTop:12}}><button className="btn">Sign In</button></div>
        </form>
      </div>
    </div>
  </>);
}
