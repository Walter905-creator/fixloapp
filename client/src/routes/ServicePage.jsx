import React from 'react';
import { useParams } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { makeTitle, makeDescription, slugify } from '../utils/seo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ServicePage() {
  const { service } = useParams();
  const serviceSlug = slugify(service);
  const title = makeTitle({ service: serviceSlug });
  const description = makeDescription({ service: serviceSlug });
  const canonicalPathname = `/services/${serviceSlug}`;

  return (
    <>
      <HelmetSEO
        title={title}
        description={description}
        canonicalPathname={canonicalPathname}
      />
      <Navbar />
      <main style={{ minHeight: '80vh', padding: '40px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {makeTitle({ service: serviceSlug }).replace(' | Fixlo', '')}
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#475569', marginBottom: '2rem' }}>
            {description}
          </p>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Professional {serviceSlug} Services</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Qualified and experienced professionals</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Transparent pricing and quotes</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Quality guarantee on all work</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Same-day and emergency service available</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1.1rem',
                cursor: 'pointer'
              }}
              onClick={() => window.location.href = '/'}
            >
              Get Started
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}