import React from 'react';
import { useParams } from 'react-router-dom';
import HelmetSEO from '../seo/HelmetSEO';
import { makeTitle, makeDescription, slugify } from '../utils/seo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ServiceStatePage() {
  const { service, state } = useParams();
  const serviceSlug = slugify(service);
  const stateSlug = slugify(state);
  const title = makeTitle({ service: serviceSlug, state: stateSlug });
  const description = makeDescription({ service: serviceSlug, state: stateSlug });
  const canonicalPathname = `/services/${serviceSlug}/${stateSlug}`;

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
            {makeTitle({ service: serviceSlug, state: stateSlug }).replace(' | Fixlo', '')}
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#475569', marginBottom: '2rem' }}>
            {description}
          </p>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Statewide Service Coverage</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Licensed professionals across the state</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Local regulations and permits handled</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Emergency service available</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Competitive local pricing</li>
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
              Find Local Pros
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}