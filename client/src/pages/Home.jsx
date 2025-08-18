import React from 'react';
import Seo from '../components/Seo';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <div style={{padding:"12px 16px", background:"#f6f7fb", fontSize:14}}>
        <strong>Fixlo</strong> — loading features…
      </div>
      <main style={{maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
        <Seo path="/" />
        <h1>Fixlo</h1>
        <p>Book trusted home services near you. Plumbing, electrical, HVAC, and more.</p>

        <div style={{marginTop:16,display:'flex',gap:12,flexWrap:'wrap'}}>
          <Link to="/signup" className="btn">Sign up</Link>
          {/* Your Request a Service popup/buttons live elsewhere; unchanged */}
        </div>
      </main>
    </>
  );
}