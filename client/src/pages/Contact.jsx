import React from 'react';
import SEO from '../utils/seo';

export default function Contact() {
  return (
    <main style={{maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
      <SEO 
        title="Contact Us - Fixlo"
        description="Contact Fixlo support team for assistance with home services, professional accounts, or technical help. Get in touch via email or phone."
      />
      <h1>Contact Us</h1>
      <p>Get in touch with our support team for assistance with your account or any questions about our services.</p>
      
      <div style={{marginTop: 32}}>
        <h2>Support</h2>
        <p>Email: support@fixloapp.com</p>
        <p>We typically respond within 24 hours.</p>
        
        <h2>For Professionals</h2>
        <p>Email: pros@fixloapp.com</p>
        <p>Questions about joining our network or managing your account.</p>
      </div>
    </main>
  );
}