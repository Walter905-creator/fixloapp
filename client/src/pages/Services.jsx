import React from 'react';
import SEO from '../utils/seo';
import { Link } from 'react-router-dom';

export default function Services() {
  const services = [
    { slug: 'plumbing', name: 'Plumbing', icon: '🚰' },
    { slug: 'electrical', name: 'Electrical', icon: '💡' },
    { slug: 'hvac', name: 'HVAC', icon: '❄️' },
    { slug: 'carpentry', name: 'Carpentry', icon: '🪚' },
    { slug: 'painting', name: 'Painting', icon: '🎨' },
    { slug: 'roofing', name: 'Roofing', icon: '🏠' },
    { slug: 'house-cleaning', name: 'House Cleaning', icon: '🧹' },
    { slug: 'landscaping', name: 'Landscaping', icon: '🌿' },
  ];

  return (
    <main style={{maxWidth:960,margin:'32px auto',padding:'0 16px'}}>
      <SEO 
        title="Home Services - Professional Contractors | Fixlo"
        description="Browse all home services available on Fixlo. Find professional contractors for plumbing and all your home service needs. More services coming soon."
      />
      <h1>Home Services</h1>
      <p>Find trusted professionals for all your home service needs.</p>
      
      <div style={{marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
        {services.map(service => (
          <Link 
            key={service.slug}
            to={`/services/${service.slug}`}
            style={{
              display: 'block',
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              textAlign: 'center'
            }}
          >
            <div style={{fontSize: '32px', marginBottom: '8px'}}>{service.icon}</div>
            <h3>{service.name}</h3>
          </Link>
        ))}
      </div>
    </main>
  );
}