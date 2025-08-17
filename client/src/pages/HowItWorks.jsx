import React from 'react';
import Seo from '../components/Seo';

export default function HowItWorks() {
  return (
    <main style={{maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
      <Seo 
        path="/how-it-works"
        title="How It Works | Fixlo"
        description="Learn how Fixlo works. Simple 3-step process to connect homeowners with verified professional contractors for all home service needs."
      />
      <h1>How It Works</h1>
      <p>Learn how Fixlo connects homeowners with trusted professionals in just a few easy steps.</p>
      
      <div style={{marginTop: 32}}>
        <h2>1. Request a Service</h2>
        <p>Tell us what you need help with and your location.</p>
        
        <h2>2. Get Connected</h2>
        <p>Verified professionals in your area will contact you directly.</p>
        
        <h2>3. Get It Done</h2>
        <p>Choose the pro that's right for you and get your project completed.</p>
      </div>
    </main>
  );
}