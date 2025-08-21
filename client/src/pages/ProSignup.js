import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ProSignup() {
  const onSubmit = e => {
    e.preventDefault();
    alert('Demo pro signup submitted (wire to backend).');
  };

  return (
    <>
      <Helmet>
        <title>Join as a Professional - Fixlo</title>
        <meta 
          name="description" 
          content="Join Fixlo as a trusted home service professional. Connect with homeowners in your area and grow your business. Sign up today to start receiving service requests." 
        />
        <link rel="canonical" href="https://www.fixloapp.com/pro/signup" />
      </Helmet>
      <Navbar />
      <main className="container" style={{padding:'3rem 0'}}>
        <h1 className="text-3xl font-bold mb-6">Professional Signup</h1>
        <form onSubmit={onSubmit} className="grid" style={{gap:'1rem',maxWidth:'32rem'}}>
          <input 
            style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} 
            placeholder="Business name" 
            required
          />
          <input 
            style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} 
            placeholder="Trade (e.g., plumbing)" 
            required
          />
          <input 
            style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} 
            placeholder="Phone" 
            required
          />
          <input 
            style={{border:'1px solid #e5e7eb',borderRadius:'1rem',padding:'0.75rem'}} 
            placeholder="Email" 
            type="email" 
            required
          />
          <button className="btn btn-primary" style={{width:'100%'}}>
            Create pro account
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}