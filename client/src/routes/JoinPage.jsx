import React from 'react';
import HelmetSEO from '../seo/HelmetSEO';
export default function JoinPage(){
  return (<>
    <HelmetSEO title="Join Fixlo – Pros" canonicalPathname="/join" />
    <div className="container">
      <h1>Join as a Professional</h1>
      <div className="card">
        <form onSubmit={(e)=>{e.preventDefault(); alert('Submitted (demo). Connect Stripe + Checkr.')}}>
          <label>Full Name</label><input required/>
          <label>Phone</label><input required/>
          <label>Trade</label>
          <select required>
            {['plumbing','electrical','carpentry','painting','hvac','roofing','landscaping','house-cleaning','junk-removal'].map(t=>(
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label>Date of Birth</label><input type="date" required/>
          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
            <input id="sms" type="checkbox" required/>
            <label htmlFor="sms">I agree to receive SMS about job leads. Reply STOP to unsubscribe.</label>
          </div>
          <div style={{marginTop:12}}><button className="btn">Create Account</button></div>
        </form>
      </div>
    </div>
  </>);
}
