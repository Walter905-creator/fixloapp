import React from 'react';
import SEO from '../utils/seo';

export default function NotFound(){
  return (
    <main style={{maxWidth:720,margin:'32px auto',padding:'0 16px'}}>
      <SEO title="Page Not Found – Fixlo" />
      <h1>404 – Not Found</h1>
      <p>That page isn't available.</p>
    </main>
  );
}