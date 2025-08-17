import React from 'react';
import { useParams } from 'react-router-dom';
import Seo from '../components/Seo';

export default function ServiceDetail() {
  const { service } = useParams();
  
  const serviceNames = {
    'plumbing': 'Plumbing',
    'electrical': 'Electrical',
    'hvac': 'HVAC',
    'carpentry': 'Carpentry',
    'painting': 'Painting',
    'roofing': 'Roofing',
    'house-cleaning': 'House Cleaning',
    'landscaping': 'Landscaping'
  };
  
  const serviceName = serviceNames[service] || service;

  return (
    <main style={{maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
      <Seo 
        path={`/services/${service}`}
        title={`${serviceName} Services | Fixlo`}
        description={`Find verified ${serviceName.toLowerCase()} professionals in your area. Get quotes and book trusted contractors for your ${serviceName.toLowerCase()} needs.`}
      />
      <h1>{serviceName} Services</h1>
      <p>Find trusted {serviceName.toLowerCase()} professionals in your area.</p>
      
      <div style={{marginTop: 32}}>
        <h2>How It Works</h2>
        <ol>
          <li>Tell us about your {serviceName.toLowerCase()} project</li>
          <li>Get connected with verified professionals</li>
          <li>Compare quotes and choose the right pro</li>
          <li>Get your project done right</li>
        </ol>
        
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
          Request {serviceName} Service
        </button>
      </div>
    </main>
  );
}