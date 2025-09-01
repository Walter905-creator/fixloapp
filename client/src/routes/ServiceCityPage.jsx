import React from 'react';
import { useParams } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { makeTitle, makeDescription, slugify } from '../utils/seo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ServiceCityPage() {
  const { service, city } = useParams();
  const serviceSlug = slugify(service);
  const citySlug = slugify(city);
  const title = makeTitle({ service: serviceSlug, city: citySlug });
  const description = makeDescription({ service: serviceSlug, city: citySlug });
  const canonicalPathname = `/services/${serviceSlug}/${citySlug}`;

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
            {makeTitle({ service: serviceSlug, city: citySlug }).replace(' | Fixlo', '')}
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#475569', marginBottom: '2rem' }}>
            {description}
          </p>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Why Choose Fixlo?</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Background-checked professionals</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Fast quotes and easy scheduling</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Licensed and insured contractors</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ 24/7 customer support</li>
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
              Get Free Quote
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}