import React from 'react';
import SEO from '../utils/seo';

export default function ProSignup() {
  return (
    <main style={{maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
      <SEO 
        title="Professional Sign Up - Join Fixlo"
        description="Join Fixlo's network of verified home service professionals. Get connected with customers in your area and grow your business."
      />
      <h1>Join Fixlo as a Professional</h1>
      <p>Connect with homeowners in your area and grow your business with Fixlo.</p>
      
      <div style={{marginTop: 32}}>
        <h2>Benefits of Joining</h2>
        <ul>
          <li>Get instant notifications when customers need your services</li>
          <li>Build your reputation with verified reviews</li>
          <li>Secure payment processing</li>
          <li>Professional dashboard to manage your business</li>
        </ul>
        
        <button 
          style={{
            background: '#667eea',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            marginTop: '16px',
            cursor: 'pointer'
          }}
        >
          Get Started
        </button>
      </div>
    </main>
  );
}